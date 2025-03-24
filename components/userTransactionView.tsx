"use client";

import { MetaKeep } from "metakeep";
import Link from "next/link";
import React, { useEffect, useState } from "react";

interface ParamInput {
  name: string;
  type: string;
  value: string;
}

const UserTransaction: React.FC = () => {
  const [contractAddress, setContractAddress] = useState("");
  const [chainId, setChainId] = useState("");
  const [rpcUrl, setRpcUrl] = useState("");
  const [abi, setAbi] = useState<any[]>([]);
  const [functionDetails, setFunctionDetails] = useState<{
    name: string;
    params: { [key: string]: string };
  } | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<any | null>(null);
  const [paramInputs, setParamInputs] = useState<ParamInput[]>([]);
  const [sdk, setSdk] = useState<MetaKeep | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Record page load for telemetry (this would call your backend API)
    recordPageLoad();

    // Parse URL parameters
    parseUrlParams();

    // Initialize MetaKeep SDK
    initMetaKeep();
  }, []);

  const recordPageLoad = async () => {
    try {
      // Call your telemetry API endpoint
      await fetch('/api/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: 'user-transaction',
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error("Failed to record telemetry", error);
    }
  };

  const parseUrlParams = () => {
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const contractParam = urlParams.get("contract");
    const chainIdParam = urlParams.get("chainId");
    const rpcUrlParam = urlParams.get("rpcUrl");
    const abiEncoded = urlParams.get("abi");
    const functionData = urlParams.get("func");

    if (!contractParam || !chainIdParam || !rpcUrlParam || !abiEncoded) {
      return setStatusMessage("❌ Missing required parameters in URL");
    }

    setContractAddress(contractParam);
    setChainId(chainIdParam);
    setRpcUrl(rpcUrlParam);

    try {
      // Decode and parse ABI
      const abiDecoded = atob(abiEncoded);
      const abiParsed = JSON.parse(abiDecoded);
      setAbi(Array.isArray(abiParsed) ? abiParsed : abiParsed.abi || []);

      // Decode and parse function data if provided
      if (functionData) {
        const funcDetails = JSON.parse(atob(functionData));
        setFunctionDetails(funcDetails);
        
        // Find the function in the ABI
        const func = abiParsed.find((f: any) => 
          f.type === "function" && f.name === funcDetails.name
        );
        
        if (func) {
          setSelectedFunction(func);
          
          // Set up parameter inputs with values from the URL
          if (func.inputs) {
            const inputs = func.inputs.map((input: any) => ({
              name: input.name,
              type: input.type,
              value: funcDetails.params[input.name] || "",
            }));
            setParamInputs(inputs);
          }
        }
      }
    } catch (error) {
      console.error("Failed to parse parameters", error);
      setStatusMessage("❌ Invalid parameters in URL");
    }
  };

  const initMetaKeep = async () => {
    try {
      const appId = process.env.NEXT_PUBLIC_METAKEEP_ID;
      if (!appId) {
        throw new Error("MetaKeep App ID not configured");
      }

      const instance = new MetaKeep({
        appId: appId,
      });
      
      setSdk(instance);
      
      const user = await instance.getWallet();
      console.log("✅ MetaKeep user loaded:", user);
      setInitialized(true);
    } catch (err) {
      console.error("❌ MetaKeep init failed", err);
      setStatusMessage("❌ MetaKeep initialization failed. Check App ID configuration.");
    }
  };

  const handleSubmitTransaction = async () => {
    if (!sdk) {
      return setStatusMessage("❌ MetaKeep not initialized.");
    }
    if (!selectedFunction) {
      return setStatusMessage("❌ No function selected.");
    }
    if (!chainId || !rpcUrl || !contractAddress) {
      return setStatusMessage("❌ Missing contract or chain details.");
    }

    setLoading(true);
    setStatusMessage("Signing and submitting transaction...");

    try {
      // Extract parameter values in correct order
      const paramValues = selectedFunction.inputs.map((input: any) => {
        const param = paramInputs.find(p => p.name === input.name);
        return param ? param.value : "";
      });

      // Submit transaction
      await sdk.signTransaction({
        chainId: Number(chainId),
        rpcUrl,
        contract: contractAddress,
        functionName: selectedFunction.name,
        args: paramValues,
      }, "eth_signTypedData_v4");

      setStatusMessage("✅ Transaction submitted successfully!");
    } catch (err: any) {
      console.error("Transaction error:", err);
      setStatusMessage(`❌ Transaction failed: ${err?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  if (!initialized) {
    return (
      <div className="p-8 max-w-xl mx-auto bg-white rounded-xl text-gray-900 shadow border mt-10">
        <h1 className="text-2xl font-bold mb-4">Initializing MetaKeep...</h1>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-xl mx-auto bg-white rounded-xl shadow border mt-10">
      <h1 className="text-2xl font-bold mb-4">🚀 Execute Smart Contract Function</h1>
      
      <div className="mb-6 space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h2 className="text-lg font-medium text-gray-800 mb-2">Transaction Details</h2>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Contract:</span>{" "}
              <span className="font-mono text-gray-600">{contractAddress}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Chain ID:</span>{" "}
              <span className="font-mono text-gray-600">{chainId}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Function:</span>{" "}
              <span className="font-mono text-gray-600">{selectedFunction?.name || "Loading..."}</span>
            </p>
          </div>
        </div>

        {paramInputs.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h2 className="text-lg font-medium text-gray-800 mb-2">Function Parameters</h2>
            <div className="space-y-3">
              {paramInputs.map((param, index) => (
                <div key={index} className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700">
                    {param.name} <span className="text-gray-500">({param.type})</span>
                  </label>
                  <input
                    type="text"
                    className="mt-1 p-2 border border-gray-300 rounded-md"
                    value={param.value}
                    onChange={(e) => {
                      const newParams = [...paramInputs];
                      newParams[index] = { ...param, value: e.target.value };
                      setParamInputs(newParams);
                    }}
                    placeholder={`Enter ${param.name}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleSubmitTransaction}
        disabled={loading}
        className={`w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Processing..." : "Sign & Submit Transaction"}
      </button>

      {statusMessage && (
        <div className={`mt-4 text-center text-sm p-3 rounded-lg ${
          statusMessage.startsWith("❌") 
            ? "bg-red-50 text-red-700 border border-red-200" 
            : statusMessage.startsWith("✅") 
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
        }`}>
          {statusMessage}
        </div>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-indigo-600 hover:underline text-sm"
        >
          ← Back to Developer View
        </Link>
      </div>
    </div>
  );
};

export default UserTransaction;