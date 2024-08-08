/*
Test Command:
/// All Tests case Run
node --test --require ts-node/register ./src/test/demo.test.ts 

/// Single Test case Run
node --test --test-name-pattern='On-Success-2' --require ts-node/register ./src/test/demo.test.ts
*/

import {test} from "node:test";
import assert from "node:assert"
import { AddCommand, AddRequestDTO, AddResponseDTO, Main } from "../core/demo";
import sinon from 'sinon';
import mediatR from "../core/shared/mediatR";
import { DataResponse } from "../core/shared/models/response";


test('On-Success-1', async () => {
  let mainObj = new Main();

  let result = await mainObj.addCall(1, 1);

  assert.equal(result.Data?.result, 2);
});

test('On-Success-2', async () => {
  let mainObj = new Main();

  let result = await mainObj.addCall(1, 1);

  assert.equal(result.Data?.result, 2);
});

test.only('On-Success-3-spy', async () => {
  let mainObj = new Main();

  // Spy on the addCall method
  const addCallSpy = sinon.spy(mainObj, 'addCall');

  // Call the method
  let result = await mainObj.addCall(1, 1);

  // Assert the result (assuming the original method returns { Data: { result: 2 } })
  assert.equal(result.Data?.result, 2);

  // Assert that the method was called once
  assert.equal(addCallSpy.calledOnce, true);

  // Assert that the method was called with the correct arguments
  assert.deepEqual(addCallSpy.firstCall.args, [1, 1]);

  // Restore the original method
  addCallSpy.restore();
});

test.only('On-Success-4-stub', async () => {
  let mainObj = new Main();

  // Fake response
  const fakeResponse: DataResponse<AddResponseDTO|null> = {
    Success:true,
    StatusCode:200,
    Data:{
      result: 2
    }
  } 

  // Stub the mediatR.send method
  const mediatRStub = sinon.stub(mediatR, 'send').resolves(fakeResponse);

  // Call the method
  let result = await mainObj.addCall(1, 1);

  // Assert the result
  assert.equal(result.Data?.result, 2);

  // Assert that the mediatR.send method was called once
  assert.equal(mediatRStub.calledOnce, true);

  // Assert that the mediatR.send method was called with the correct arguments
  const expectedAddRequestDTO = new AddRequestDTO();
  expectedAddRequestDTO.a = 1;
  expectedAddRequestDTO.b = 1;
  assert.deepEqual(mediatRStub.firstCall.args[0], new AddCommand(expectedAddRequestDTO));

  // Restore the original method
  mediatRStub.restore();
});