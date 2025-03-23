"use client";

import { metakeep } from "@/app/configs/metakeep";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Loader } from "lucide-react";
import { useState } from "react";

const SignTransaction= () => {
    const [transactionHash, setTransactionHash] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSignTransaction = async () => {
        try {
            setLoading(true);
            const transactionData = {
                to: "0x123456789abcdef...",
                value: "0.1",
                data: "",
            };

            const reason = "Developer-initiated signing request";

            const signature = await metakeep.signTransaction(transactionData, reason);
            setTransactionHash(signature);
        } catch (error) {
            console.error("Transaction signing failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="bg-gray-950 border border-gray-800 text-gray-100 w-full max-w-xl mx-auto mt-12 p-6">
            <CardHeader>
                <h3 className="text-2xl font-bold mb-2">Sign a Transaction</h3>
                <p className="text-gray-400">Provide blockchain details and securely sign with MetaKeep.</p>
            </CardHeader>
            <CardContent>
                <Button
                    onClick={handleSignTransaction}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded-xl"
                >
                    {loading ? (<Loader className="animate-spin h-5 w-5 mr-2" />) : "Sign Transaction"}
                </Button>
            </CardContent>
            <CardFooter>
                {transactionHash && (
                    <p className="text-green-400 break-all mt-4 text-sm">Signed Transaction Hash: {transactionHash}</p>
                )}
            </CardFooter>
        </Card>
    );
};

export default SignTransaction;
