import UserTransaction from "@/components/userTransactionView"

const page = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-gray-100 p-6">
      {/* <h1 className="text-2xl font-bold mb-4">User Page</h1> */}
      <UserTransaction/>
    </div>
  )
}

export default page
