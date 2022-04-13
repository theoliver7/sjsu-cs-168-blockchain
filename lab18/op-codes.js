'use strict';

let opcodes = {
    0x01: {
        mnemonic: 'ADD', gas: 3, evaluate: (vm) => {
            let v1 = vm.stack.pop();
            let v2 = vm.stack.pop();
            vm.stack.push(v1 + v2);
        }
    },
    0x02: {
        mnemonic: 'MUL', gas: 5, evaluate: (vm) => {
            //
            // ***YOUR CODE HERE***
            //
            // For multiplication, pop the top 2 arguments off of
            // the stack, multiply them together, and push the
            // result back on to the stack.
            //
            let v1 = vm.stack.pop();
            let v2 = vm.stack.pop();
            vm.stack.push(v1 * v2);
        }
    },
    0x03: {
        mnemonic: 'SUB', gas: 3, evaluate: (vm) => {
            let v1 = vm.stack.pop();
            let v2 = vm.stack.pop();
            vm.stack.push(v1 - v2);
        }
    },
    0x51: {
        mnemonic: 'MLOAD', gas: 3, evaluate: (vm) => {
            let offset = vm.stack.pop();
            vm.stack.push(vm.memory[offset])
        }
    },
    0x52: {
        mnemonic: 'MSTORE', gas: 3, evaluate: (vm) => {
            let offset = vm.stack.pop();
            let value = vm.stack.pop();
            vm.memory[offset] = value
        }
    },
    0x56: {
        mnemonic: 'JUMPI', gas: 8, evaluate: (vm) => {
            let destination = vm.stack.pop();
            vm.pc = destination
        }
    },
    0x57: {
        mnemonic: 'JUMPI', gas: 10, evaluate: (vm) => {
            let destination = vm.stack.pop();
            let condition = vm.stack.pop();
            if (condition !== 0) {
                vm.pc = destination
            }
        }
    },
    0x5B: {
        mnemonic: 'JUMPDEST', gas: 1, evaluate: (vm) => {

        }
    },
    0x60: {
        mnemonic: 'PUSH1', gas: 3, evaluate: (vm) => {
            // The next byte is data, not another instruction
            vm.pc++;
            let v = vm.bytecode.readUInt8(vm.pc);
            vm.stack.push(v);
        }
    },
    0x90: {
        mnemonic: 'SWAP1', gas: 3, evaluate: (vm) => {
            let v1 = vm.stack.pop();
            let v2 = vm.stack.pop();

            vm.stack.push(v1);
            vm.stack.push(v2);
        }
    },
    0x0c: {
        mnemonic: 'PRINT', gas: 0, evaluate: (vm) => {
            // **NOTE**: This is not a real EVM opcode.
            console.log(vm.stack.pop());
        }
    },

};

exports.opcodes = opcodes;
