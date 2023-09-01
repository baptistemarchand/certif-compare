import { asset, Head } from "$fresh/runtime.ts";
import Comparator from "../islands/Comparator.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <link rel="stylesheet" href={asset("/global.css")} />
      </Head>
      <Comparator />;
    </>
  );
}
