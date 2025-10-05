"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"

export default function HomePage() {
  const router = useRouter()
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    if (user) {
      router.push("/orgs")
    } else {
      router.push("/login")
    }
  }, [user, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Loading...</h1>
      </div>
    </div>
  )
}
