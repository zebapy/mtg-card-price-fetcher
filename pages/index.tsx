import Head from "next/head";
import { useEffect, useState } from "react";
import { useCopyToClipboard } from "react-use";
import { PriceResult } from "./api/prices";

const meta = {
  title: "Magic: the Gathering Price Fetcher",
  description: "Paste a csv of card info, get prices back",
};

enum FetcherStatus {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR,
}

const plural = (count: number, word: string, plural: string) => {
  return count === 1 ? word : plural;
};

function BtnAlt(props) {
  const btnAltClass =
    "rounded-full bg-gray-200 text-gray-600 px-3 py-1 text-sm font-semibold hover:text-gray-800 hover:bg-gray-300 transition-colors";
  return <button type="button" className={btnAltClass} {...props} />;
}

const PLACEHOLDER_CSV = `name,set_code,card_number\nSwamp,BFZ,1`;

function ResultBox({ id, label, value }) {
  const [copied, setCopied] = useState(false);
  const [state, copyToClipboard] = useCopyToClipboard();

  useEffect(() => {
    if (state.value) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [state]);

  return (
    <div className="">
      <label htmlFor={id} className="text-sm font-semibold block mb-1">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        readOnly
        className="rounded block w-full h-32 bg-gray-200 p-2 text-sm mb-2"
      />
      <BtnAlt onClick={() => copyToClipboard(value)}>
        {copied ? "Copied!" : "Copy to clipboard"}
      </BtnAlt>
    </div>
  );
}

export default function Home() {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<PriceResult | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(FetcherStatus.IDLE);

  async function onSubmit(e) {
    e.preventDefault();

    setStatus(FetcherStatus.LOADING);

    const resp = await fetch("/api/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prices: value,
      }),
    });

    if (!resp.ok) {
      const data = await resp.json();
      setError(data.error);
      setStatus(FetcherStatus.ERROR);
      return;
    }

    const data = (await resp.json()) as PriceResult;

    setResult(data);

    setStatus(FetcherStatus.SUCCESS);
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container p-12 max-w-4xl">
        <main className="">
          <h1 className="font-bold text-4xl mb-2">{meta.title} ????</h1>

          <p className="text-xl text-gray-600 mb-4">{meta.description}</p>

          <div className="space-y-6">
            <form onSubmit={onSubmit}>
              <label htmlFor="cards" className="font-semibold">
                Cards to price
              </label>
              <p className="text-sm text-gray-600 mb-2">
                Your <abbr title="Comma Separated Values">csv</abbr> must start
                with a "header" row with at least <code>set_code</code> (e.g.
                BFZ)
                <br />
                and <code>card_number</code> (e.g. 133) columns &mdash;{" "}
                <button
                  type="button"
                  onClick={() => setValue(PLACEHOLDER_CSV)}
                  className="underline"
                >
                  Insert example
                </button>
              </p>
              <textarea
                name="cards"
                id="cards"
                value={value}
                // placeholder={PLACEHOLDER_CSV}
                onChange={(e) => setValue(e.target.value)}
                className="p-4 block w-full rounded mb-2 resize-y h-32"
                required
              />
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="rounded-full bg-purple-500 text-white py-2 px-4 font-bold hover:bg-purple-900 transition-colors disabled:opacity-50 disabled:cursor-wait"
                  disabled={status === FetcherStatus.LOADING}
                >
                  {status === FetcherStatus.LOADING
                    ? "Fetching prices..."
                    : "Fetch prices"}
                </button>
                <div></div>
              </div>
            </form>

            {status === FetcherStatus.LOADING && (
              <div className="animate-bounce text-lg">????</div>
            )}

            {status === FetcherStatus.ERROR && (
              <p className="bg-red-400 text-white mb-4 p-2 rounded">
                <strong>Uh oh!</strong> {error}
              </p>
            )}

            {status === FetcherStatus.SUCCESS && (
              <div className="space-y-4 border-2 border-green-400 p-8 rounded-lg">
                <h2 className="text-green-500 font-bold text-lg">
                  We found prices for {result?.found_total}{" "}
                  {plural(result.found_total, "card", "cards")} out of{" "}
                  {result?.total}
                </h2>

                {result?.found && (
                  <ResultBox
                    id="found"
                    label={`Found cards (${result.found_total}) ????`}
                    value={result.found}
                  />
                )}
                {result?.unfound && (
                  <ResultBox
                    id="unfound"
                    label={`Unfound cards (${result.unfound_total}) ????`}
                    value={result.unfound}
                  />
                )}
              </div>
            )}
          </div>
        </main>

        <footer className="space-y-2 pt-16 text-sm text-gray-500 ">
          <p className="">
            Prices supplied by{" "}
            <a
              href="https://scryfall.com/"
              className="text-purple-500 underline"
            >
              Scryfall API
            </a>{" "}
            though this is not a partner site
          </p>

          <p>Not affiliated with MTG Wizards of the Coast.</p>

          <p>
            Built by{" "}
            <a href="https://zeb.codes" className="underline text-purple-500">
              zeb.codes
            </a>
            .{" "}
            <a
              href="https://github.com/zebapy/mtg-card-price-fetcher"
              className="underline text-purple-500"
            >
              View on GitHub
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
