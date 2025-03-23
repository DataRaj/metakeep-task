"use client";

import { MetaKeep } from "metakeep";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const UserView: React.FC = () => {
  const [contractAddress, setContractAddress] = useState("");
  const [chainId, setChainId] = useState("");
  const [rpcUrl, setRpcUrl] = useState("");
  const [abi, setAbi] = useState<any[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<any | null>(null);
  const [paramValues, setParamValues] = useState<{ [key: string]: string }>({});
  const [sdk, setSdk] = useState<MetaKeep | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    parseUrlParams();
    try {
      const instance = new MetaKeep({
        appId: process.env.NEXT_PUBLIC_METAKEEP_ID!,
      });
      setSdk(instance,);
      instance.getWallet().then((user) => {
        console.log("✅ MetaKeep user loaded:", user);
      });
    } catch (err) {
      console.error("❌ MetaKeep init failed", err);
      setStatusMessage("❌ MetaKeep initialization failed. Check App ID.");
    }
  }, []);

  const parseUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    setContractAddress(urlParams.get("contract") ?? "");
    setChainId(urlParams.get("chainId") ?? "");
    setRpcUrl(urlParams.get("rpcUrl") ?? "");

    const abiEncoded = urlParams.get("abi");
    if (!abiEncoded) return setStatusMessage("❌ ABI not found in URL.");
    try {
      const decoded = atob(abiEncoded);
      const parsed = JSON.parse(decoded);
      setAbi(Array.isArray(parsed) ? parsed : parsed.abi ?? []);
    } catch {
      setStatusMessage("❌ Failed to decode or parse ABI.");
    }
  };

  const handleFunctionSelect = (funcName: string) => {
    const func = abi.find((f) => f.name === funcName);
    setSelectedFunction(func || null);
    if (func && func.inputs) {
      const initValues: any = {};
      func.inputs.forEach((input: any) => {
        initValues[input.name] = "";
      });
      setParamValues(initValues);
    }
  };

  const handleParamChange = (name: string, value: string) => {
    setParamValues({ ...paramValues, [name]: value });
  };

  const handleTransaction = async () => {
    if (!sdk) return setStatusMessage("❌ MetaKeep not initialized.");
    if (!selectedFunction) return setStatusMessage("Please select a contract function.");
    if (!chainId || !rpcUrl || !contractAddress) return setStatusMessage("Missing essential details.");

    setLoading(true);
    setStatusMessage("Signing and submitting transaction...");

    try {
      await sdk.signTransaction({
        chainId: Number(chainId),
        rpcUrl,
        contract: contractAddress,
        functionName: selectedFunction.name,
        args: Object.values(paramValues),
      }, "eth_signTypedData_v4");

      setStatusMessage("✅ Transaction submitted successfully.");
    } catch (err: any) {
      setStatusMessage(`❌ Transaction failed: ${err?.message ?? "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto bg-white rounded-xl shadow border mt-10">
      <h1 className="text-2xl font-bold mb-4">🚀 Execute Smart Contract Function</h1>
      <p className="text-sm text-gray-600 mb-6">
        Select a function and fill parameters to sign via MetaKeep.
      </p>

      <div className="mb-4">
        <label className="block text-gray-700 mb-1">Select Function:</label>
        <select
          value={selectedFunction?.name || ""}
          onChange={(e) => handleFunctionSelect(e.target.value)}
          className="w-full p-2 border rounded focus:outline-none focus:ring"
        >
          <option value="">-- Choose Function --</option>
          {abi
            .filter((item) => item.type === "function")
            .map((item, i) => (
              <option key={i} value={item.name}>
                {item.name}
              </option>
            ))}
        </select>
      </div>

      {selectedFunction &&
        selectedFunction.inputs.map((input: any, i: number) => (
          <div className="mb-4" key={i}>
            <label className="block text-gray-700 mb-1">
              {input.name} ({input.type})
            </label>
            <input
              type="text"
              value={paramValues[input.name] || ""}
              onChange={(e) => handleParamChange(input.name, e.target.value)}
              placeholder={`Enter ${input.name}`}
              className="w-full p-2 border rounded focus:outline-none focus:ring"
            />
          </div>
        ))}

      <button
        onClick={handleTransaction}
        disabled={loading}
        className={`w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Processing..." : "Sign & Submit Transaction"}
      </button>

      {statusMessage && (
        <div className="mt-4 text-center text-sm text-gray-800 bg-gray-100 rounded p-3">
          {statusMessage}
        </div>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-indigo-600 hover:underline text-sm"
          target="_blank"
        >
          ← Back to Developer View
        </Link>
      </div>
    </div>
  );
};

export default UserView;
