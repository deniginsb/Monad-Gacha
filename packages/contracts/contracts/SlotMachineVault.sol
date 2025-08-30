// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract SlotMachineVault is Ownable2Step, Pausable, ReentrancyGuard {
    using ECDSA for bytes32;

    uint256 public constant MULTIPLIER_BASE = 100;

    struct Symbol {
        string name;
        string imageURI;
        uint16 weight;
        uint32 multiplier;
    }

    uint256 public entryFee;
    uint256 public seasonId;
    uint256 public maxPayoutPerSpin;
    uint256 public dailyCap;
    uint256 public perUserCap;

    address public signer;

    Symbol[] private symbols;
    uint256 private totalWeight;

    mapping(uint256 => uint256) public dailyPaid;
    mapping(uint256 => mapping(address => uint256)) public dailyPaidByUser;

    mapping(bytes32 => bool) public usedDigests;

    event SpinResult(address indexed player, uint256 seasonId, uint256 roundId, uint8[3] reels, uint256 payout);
    event SymbolsUpdated();
    event EntryFeeUpdated(uint256 fee);
    event CapsUpdated(uint256 maxPerSpin, uint256 dailyCap, uint256 perUserCap);
    event VaultFunded(address indexed from, uint256 amount);
    event SeasonUpdated(uint256 seasonId);
    event SignerUpdated(address signer);
    event PausedState(bool paused);

    constructor(
        uint256 _entryFee,
        uint256 _seasonId,
        uint256 _maxPayoutPerSpin,
        uint256 _dailyCap,
        uint256 _perUserCap,
        address _signer
    ) {
        require(_signer != address(0), "bad signer");
        entryFee = _entryFee;
        seasonId = _seasonId;
        maxPayoutPerSpin = _maxPayoutPerSpin;
        dailyCap = _dailyCap;
        perUserCap = _perUserCap;
        signer = _signer;
    }

    function pause() external onlyOwner { _pause(); emit PausedState(true); }
    function unpause() external onlyOwner { _unpause(); emit PausedState(false); }

    function setEntryFee(uint256 newFee) external onlyOwner {
        entryFee = newFee;
        emit EntryFeeUpdated(newFee);
    }

    function setSymbols(Symbol[] calldata newSymbols) external onlyOwner {
        delete symbols;
        uint256 wsum;
        for (uint256 i = 0; i < newSymbols.length; i++) {
            require(newSymbols[i].weight > 0, "weight=0");
            symbols.push(
                Symbol({
                    name: newSymbols[i].name,
                    imageURI: newSymbols[i].imageURI,
                    weight: newSymbols[i].weight,
                    multiplier: newSymbols[i].multiplier
                })
            );
            wsum += newSymbols[i].weight;
        }
        require(symbols.length >= 1, "no symbols");
        totalWeight = wsum;
        emit SymbolsUpdated();
    }

    function setCaps(uint256 _maxPerSpin, uint256 _dailyCap, uint256 _perUserCap) external onlyOwner {
        maxPayoutPerSpin = _maxPerSpin;
        dailyCap = _dailyCap;
        perUserCap = _perUserCap;
        emit CapsUpdated(_maxPerSpin, _dailyCap, _perUserCap);
    }

    function setSigner(address s) external onlyOwner {
        require(s != address(0), "zero signer");
        signer = s;
        emit SignerUpdated(s);
    }

    function setSeason(uint256 newSeason) external onlyOwner {
        seasonId = newSeason;
        emit SeasonUpdated(newSeason);
    }

    function fundVault() external payable {
        emit VaultFunded(msg.sender, msg.value);
    }

    function withdraw(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "bad to");
        require(amount <= address(this).balance, "insufficient");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "withdraw failed");
    }

    function getSymbols() external view returns (Symbol[] memory list, uint256 _totalWeight) {
        return (symbols, totalWeight);
    }

    function getConfig() external view returns (
        uint256 _entryFee,
        uint256 _seasonId,
        uint256 _maxPayoutPerSpin,
        uint256 _dailyCap,
        uint256 _perUserCap,
        address _signer
    ) {
        return (entryFee, seasonId, maxPayoutPerSpin, dailyCap, perUserCap, signer);
    }

    function spin(
        uint256 roundId,
        uint256 deadline,
        bytes32 serverSeedHash,
        bytes calldata sig
    )
        external
        payable
        whenNotPaused
        nonReentrant
        returns (uint8[3] memory reels, uint256 payout)
    {
        require(msg.value == entryFee, "bad fee");
        require(block.timestamp <= deadline, "expired");
        require(symbols.length > 0 && totalWeight > 0, "symbols not set");

        bytes32 digest = keccak256(abi.encodePacked(address(this), msg.sender, roundId, seasonId, deadline, serverSeedHash))
            .toEthSignedMessageHash();
        require(!usedDigests[digest], "replayed");
        usedDigests[digest] = true;
        address rec = ECDSA.recover(digest, sig);
        require(rec == signer, "bad sig");

        bytes32 seed = keccak256(
            abi.encodePacked(
                serverSeedHash,
                roundId,
                msg.sender,
                block.prevrandao,
                blockhash(block.number - 1),
                address(this)
            )
        );

        uint8[3] memory idxs;
        for (uint256 i = 0; i < 3; i++) {
            seed = keccak256(abi.encodePacked(seed, i));
            uint256 r = uint256(seed) % totalWeight;
            idxs[i] = _pickWeighted(uint32(r));
        }

        uint256 rawPayout = 0;
        if (idxs[0] == idxs[1] && idxs[1] == idxs[2]) {
            uint256 mult = symbols[idxs[0]].multiplier;
            rawPayout = (entryFee * mult) / MULTIPLIER_BASE;
        }

        uint256 day = block.timestamp / 1 days;
        uint256 remainVault = address(this).balance;
        if (rawPayout > 0) {
            uint256 remainDaily = dailyCap > dailyPaid[day] ? (dailyCap - dailyPaid[day]) : 0;
            uint256 remainUser = perUserCap > dailyPaidByUser[day][msg.sender] ? (perUserCap - dailyPaidByUser[day][msg.sender]) : 0;
            uint256 capped = rawPayout;

            if (maxPayoutPerSpin > 0 && capped > maxPayoutPerSpin) capped = maxPayoutPerSpin;
            if (remainDaily < capped) capped = remainDaily;
            if (remainUser < capped) capped = remainUser;
            if (remainVault < capped) capped = remainVault;

            payout = capped;
            if (payout > 0) {
                dailyPaid[day] += payout;
                dailyPaidByUser[day][msg.sender] += payout;
                (bool ok, ) = payable(msg.sender).call{value: payout}("");
                require(ok, "payout failed");
            }
        }

        emit SpinResult(msg.sender, seasonId, roundId, idxs, payout);
        return (idxs, payout);
    }

    function _pickWeighted(uint32 r) internal view returns (uint8) {
        uint256 acc;
        for (uint8 i = 0; i < symbols.length; i++) {
            acc += symbols[i].weight;
            if (r < acc) return i;
        }
        return uint8(symbols.length - 1);
    }

    receive() external payable { emit VaultFunded(msg.sender, msg.value); }
}

