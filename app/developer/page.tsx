"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { parseAbi } from "viem";

interface AbiFunction {
  name: string;
  type: string;
  inputs: {
    name: string;
    type: string;
  }[];
  stateMutability: string;
}

const DeveloperView = () => {
  const [contractAddress, setContractAddress] = useState("");
  const [chainId, setChainId] = useState("");
  const [rpcUrl, setRpcUrl] = useState("");
  const [abiText, setAbiText] = useState("");
  const [parsedAbi, setParsedAbi] = useState<any[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<AbiFunction | null>(null);
  const [params, setParams] = useState<{[key: string]: string}>({});
  const [generatedLink, setGeneratedLink] = useState("");
  const [error, setError] = useState("");

  // Parse ABI when text changes
  useEffect(() => {
    if (!abiText) {
      setParsedAbi([]);
      return;
    }

    try {
      const parsed = JSON.parse(abiText);
      setParsedAbi(Array.isArray(parsed) ? parsed : parsed.abi || []);
      setError("");
    } catch (err) {
      setParsedAbi([]);
      setError("Invalid ABI format. Please check your JSON.");
    }
  }, [abiText]);

  const handleFunctionSelect = (funcName: string) => {
    const func = parsedAbi.find(f => f.name === funcName && f.type === "function");
    setSelectedFunction(func || null);
    
    // Initialize parameters
    if (func && func.inputs) {
      const newParams: {[key: string]: string} = {};
      func.inputs.forEach(input => {
        newParams[input.name] = "";
      });
      setParams(newParams);
    } else {
      setParams({});
    }
  };

  const handleParamChange = (name: string, value: string) => {
    setParams({...params, [name]: value});
  };

  const encodeBase64 = (input: string) => btoa(unescape(encodeURIComponent(input)));
  
  const generateTransactionLink = () => {
    if (!contractAddress || !chainId || !rpcUrl || !abiText || !selectedFunction) {
      setError("Please fill all required fields and select a function");
      return;
    }
    
    try {
      const encodedABI = encodeBase64(abiText);
      const functionData = encodeBase64(JSON.stringify({
        name: selectedFunction.name,
        params: params
      }));
      
      const link = `${window.location.origin}/user?contract=${encodeURIComponent(contractAddress)}&chainId=${encodeURIComponent(chainId)}&rpcUrl=${encodeURIComponent(rpcUrl)}&abi=${encodedABI}&func=${functionData}`;
      setGeneratedLink(link);
      setError("");
    } catch (err) {
      setError("Failed to generate link. Check your inputs.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-6">
      <div className="bg-white/90 shadow-2xl rounded-2xl p-8 w-full max-w-2xl transition-all duration-300 hover:shadow-3xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          🎯 Generate Transaction Link
        </h1>
        
        <div className="grid gap-6">
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Contract Address</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="0x..."
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Chain ID</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="1 (Ethereum Mainnet), 137 (Polygon), etc."
              value={chainId}
              onChange={(e) => setChainId(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2 font-medium">RPC URL</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="https://eth-mainnet.g.alchemy.com/v2/your-api-key"
              value={rpcUrl}
              onChange={(e) => setRpcUrl(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Contract ABI</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Paste ABI JSON here..."
              value={abiText}
              onChange={(e) => setAbiText(e.target.value)}
            />
          </div>
          
          {parsedAbi.length > 0 && (
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Select Function</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={selectedFunction?.name || ""}
                onChange={(e) => handleFunctionSelect(e.target.value)}
              >
                <option value="">-- Select a function --</option>
                {parsedAbi
                  .filter(item => item.type === "function" && item.stateMutability !== "view")
                  .map((func, index) => (
                    <option key={index} value={func.name}>
                      {func.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
          
          {selectedFunction && selectedFunction.inputs.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Function Parameters</h3>
              {selectedFunction.inputs.map((input, index) => (
                <div key={index} className="mb-3">
                  <label className="block text-gray-700 mb-1">
                    {input.name} <span className="text-gray-500 text-sm">({input.type})</span>
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder={`Enter ${input.name} (${input.type})`}
                    value={params[input.name] || ""}
                    onChange={(e) => handleParamChange(input.name, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          <button
            onClick={generateTransactionLink}
            disabled={!contractAddress || !chainId || !rpcUrl || !abiText || !selectedFunction}
            className={`p-3 rounded-lg text-white font-medium ${
              contractAddress && chainId && rpcUrl && abiText && selectedFunction 
                ? 'bg-indigo-600 hover:bg-indigo-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Generate Transaction Link
          </button>
        </div>
        
        {generatedLink && (
          <div className="mt-6 bg-gray-100 p-4 rounded-lg">
            <p className="font-medium text-gray-800 mb-2">Here's your shareable link:</p>
            <div className="flex">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="flex-1 p-2 border border-gray-300 rounded-l-lg bg-white text-gray-800 overflow-x-auto"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedLink);
                  alert("Link copied to clipboard!");
                }}
                className="bg-indigo-600 text-white px-4 rounded-r-lg hover:bg-indigo-700"
              >
                Copy
              </button>
            </div>
            <div className="mt-3">
              <Link
                href={generatedLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline transition inline-block"
              >
                Open in new tab ↗
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperView;