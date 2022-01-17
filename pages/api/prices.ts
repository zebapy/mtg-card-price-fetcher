import { NextApiRequest, NextApiResponse } from "next";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import fetch from "node-fetch";

// shape of a card from tcg app csv export
// {
//     quantity: '3',
//     name: "Green Sun's Zenith",
//     simple_name: "Green Sun's Zenith",
//     set: 'Eternal Masters',
//     card_number: '169',
//     set_code: 'EMA',
//     printing: 'Normal',
//     condition: 'Near Mint',
//     language: 'English',
//     rarity: 'Rare',
//     product_id: '118463',
//     sku: '3144952'
//   }

export type PriceResult = {
  total: number;
  found: string;
  found_total: number;
  unfound: string;
  unfound_total: number;
};

interface ScryfallCard {
  prices: {
    usd: string;
    usd_foil: string;
    usd_etched: null;
    eur: string;
    eur_foil: string;
    tix: string;
  };
}

const sleep = (n = 200) => new Promise((resolve) => setTimeout(resolve, n));

async function getPrices(contents: string): Promise<PriceResult> {
  const records = parse(contents, {
    columns: (header) => {
      return header.map((h) => h.toLowerCase().replace(/\s/g, "_"));
    },
  });

  if (records.length === 0) {
    throw new Error(
      "No cards found. Did you only supply header row but no cards rows?"
    );
  }

  // arbitrary limit of 100 unique cards per request
  if (records.length > 100) {
    throw new Error("Too many cards. We can only do 100 unique cards for now.");
  }

  if (records.every((r) => r.set_code === undefined)) {
    throw new Error(
      "No set_code header found. Must supply header row with set_code column."
    );
  }

  if (records.every((r) => r.card_number === undefined)) {
    throw new Error(
      "No card_number header found. Must supply header row with card_number column."
    );
  }

  const found = [];
  const unfound = [];

  for (const record of records) {
    // fetch the card from scryfall
    // GET https://api.scryfall.com/cards/xln/96

    const resp = await fetch(
      `https://api.scryfall.com/cards/${record.set_code.toLowerCase()}/${
        record.card_number
      }`
    );

    // dont badger their api
    await sleep();

    if (resp.status !== 200) {
      unfound.push(record);
    } else {
      const card = (await resp.json()) as ScryfallCard;

      const cardWithPrice = {
        ...record,
        price_usd: card.prices.usd,
        price_usd_foil: card.prices.usd_foil,
      };

      found.push(cardWithPrice);
    }
  }

  if (found.length === 0) {
    throw new Error("Could not match prices for any cards");
  }

  return {
    total: records.length,
    found: stringify(found, { header: true }),
    found_total: found.length,
    unfound: stringify(unfound, { header: true }),
    unfound_total: unfound.length,
  };
}

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const data = req.body.prices;

  try {
    const result = await getPrices(data);

    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
