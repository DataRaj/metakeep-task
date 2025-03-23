import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import React, { Suspense } from "react";

const Loading = () => (
  <div className="flex justify-center items-center h-20">
    <Loader2 className="animate-spin text-gray-100 w-8 h-8" />
  </div>
);

const Home: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-gray-100 px-4 py-10">
      <Suspense fallback={<Loading />}>
        <Card className="w-full max-w-2xl bg-gray-900 shadow-2xl rounded-2xl border-none">
          <CardHeader>
            <CardTitle className="text-center text-4xl md:text-5xl font-bold text-gray-100 leading-tight">
              ⚡ Quick Transaction Portal
            </CardTitle>
            <p className="text-center text-gray-400 mt-3 text-base md:text-lg">
              Generate one-off blockchain transactions and share them with ease.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 mt-6">
            <Button
              asChild
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-lg font-medium py-6 rounded-xl shadow-lg transition-all duration-300"
            >
              <Link href="/developer">Generate Transaction Link</Link>
            </Button>
            <Button
              asChild
              className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-lg font-medium py-6 rounded-xl shadow-lg transition-all duration-300"
            >
              <Link href="/user">Sign & Execute Transaction</Link>
            </Button>
          </CardContent>
        </Card>
      </Suspense>
      <footer className="mt-10 text-sm text-gray-500">
        Crafted with ❤️ using MetaKeep SDK & Next-gen design principles.
      </footer>
    </div>
  );
};

export default Home;
