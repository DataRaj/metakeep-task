"use client";
import Link from "next/link";
import { useState } from "react";

const DeveloperView = () => {
  const [contractAddress, setContractAddress] = useState("");
  const [chainId, setChainId] = useState("");
  const [rpcUrl, setRpcUrl] = useState("");
  const [abi, setAbi] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");

  const encodeBase64 = (input: string) => btoa(unescape(encodeURIComponent(input)));

  const generateTransactionLink = () => {
    if (!contractAddress || !chainId || !rpcUrl || !abi) return;
    const encodedABI = encodeBase64(abi);
    const link = `${window.location.origin}/user?contract=${encodeURIComponent(contractAddress)}&chainId=${encodeURIComponent(chainId)}&rpcUrl=${encodeURIComponent(rpcUrl)}&abi=${encodedABI}`;
    setGeneratedLink(link);
  };

  return (
    <div className="min-h-screen flex items-center justify-center  via-purple-500 bg-gray-950 to-pink-500 p-6">
      <div className="bg-white/90 shadow-2xl rounded-2xl p-8 w-full max-w-2xl transition-all duration-300 hover:shadow-3xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          🎯 Generate Transaction Link
        </h1>

        <div className="grid gap-4">
          <input
            type="text"
            placeholder="Enter Contract Address"
            className="p-3 border rounded-lg shadow-sm shadow-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
          />
          <input
            type="text"
            placeholder="Enter Chain ID"
            className="p-3 border rounded-lg shadow-sm shadow-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            value={chainId}
            onChange={(e) => setChainId(e.target.value)}
          />
          <input
            type="text"
            placeholder="RPC URL"
            className="p-3 border rounded-lg shadow-sm shadow-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            value={rpcUrl}
            onChange={(e) => setRpcUrl(e.target.value)}
          />
          <textarea
            placeholder="Paste Contract ABI JSON here"
            rows={4}
            className="p-3 border rounded-lg shadow-sm shadow-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            value={abi}
            onChange={(e) => setAbi(e.target.value)}
          />
        </div>

        <button
          onClick={generateTransactionLink}
          disabled={!contractAddress || !chainId || !rpcUrl || !abi}
          className={`w-full mt-6 py-3 font-semibold text-white rounded-lg shadow-md shadow-gray-700 transition
            ${contractAddress && chainId && rpcUrl && abi ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'}`}
        >
          Generate Transaction Link
        </button>

        {generatedLink && (
          <div className="mt-6 bg-gray-100 p-4 rounded-lg">
            <p className="font-medium text-gray-800 mb-2">Here’s your shareable link:</p>
            <Link
              href={generatedLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 break-all hover:underline transition"
            >
              {generatedLink}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperView;
