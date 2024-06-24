// This is a server component by default
import { Metadata } from "next";
import { getFrameMetadata } from "frog/next";
import HomeClient from "./HomeClient";
import { Suspense } from "react";

export async function generateMetadata(): Promise<Metadata> {
  const frameTags = await getFrameMetadata(
    `${process.env.VERCEL_URL || "http://localhost:3000"}/api`
  );
  return {
    other: frameTags,
  };
}

export default function HomePage() {
  return (
    <Suspense>
      <HomeClient />
    </Suspense>
  );
}
