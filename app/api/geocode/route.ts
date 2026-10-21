
import { NextResponse } from "next/server";

type GeocodeRequest = {
  address: string;
  city: string;
  state: string;
  zip_code?: string;
};

type CensusGeocodeResponse = {
  result?: {
    addressMatches?: Array<{
      matchedAddress?: string;
      coordinates?: {
        x?: number;
        y?: number;
      };
    }>;
  };
};

type NominatimResult = {
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
    country_code?: string;
  };
};

function normalize(value: string): string {
  return value
    .toUpperCase()
    .replace(/[.,#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function validCoordinates(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= 24.3 &&
    latitude <= 31.1 &&
    longitude >= -87.7 &&
    longitude <= -79.8
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GeocodeRequest;

    const address = body.address?.trim();
    const city = body.city?.trim();
    const state = body.state?.trim();
    const zipCode = body.zip_code?.trim() || "";

    if (!address || !city || !state) {
      return NextResponse.json(
        { error: "Address, city and state are required." },
        { status: 400 }
      );
    }

    const censusParams = new URLSearchParams({
      street: address,
      city,
      state,
      benchmark: "Public_AR_Current",
      format: "json",
    });

    if (zipCode) {
      censusParams.set("zip", zipCode);
    }

    const censusUrl =
      "https://geocoding.geo.census.gov/geocoder/locations/address?" +
      censusParams.toString();

    const censusResponse = await fetch(censusUrl, {
      cache: "no-store",
    });

    if (censusResponse.ok) {
      const censusData =
        (await censusResponse.json()) as CensusGeocodeResponse;

      const match = censusData.result?.addressMatches?.[0];
      const latitude = Number(match?.coordinates?.y);
      const longitude = Number(match?.coordinates?.x);

      if (
        match?.matchedAddress &&
        validCoordinates(latitude, longitude)
      ) {
        return NextResponse.json({
          latitude,
          longitude,
          matched_address: match.matchedAddress,
          source: "census",
        });
      }
    }

    const queries = [
      `${address}, ${city}, ${state}${zipCode ? ` ${zipCode}` : ""}, USA`,
    ];

    for (const query of queries) {
      const nominatimParams = new URLSearchParams({
        q: query,
        format: "jsonv2",
        addressdetails: "1",
        limit: "5",
        countrycodes: "us",
      });

      const response = await fetch(
        "https://nominatim.openstreetmap.org/search?" +
          nominatimParams.toString(),
        {
          headers: {
            "User-Agent": "ProjectLogistics/1.0",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        continue;
      }

      const results =
        (await response.json()) as NominatimResult[];

      const expectedHouseNumber = address.match(/^\s*(\d+[A-Z]?)\b/i)?.[1];
      const expectedZip = zipCode.replace(/\s/g, "").toUpperCase();
      const expectedCity = normalize(city);
      const expectedState = normalize(state);

      const verified = results.find((result) => {
        const latitude = Number(result.lat);
        const longitude = Number(result.lon);
        const location = result.address;

        if (!validCoordinates(latitude, longitude) || !location) {
          return false;
        }

        if (location.country_code?.toLowerCase() !== "us") {
          return false;
        }

        if (
          expectedHouseNumber &&
          location.house_number?.toUpperCase() !==
            expectedHouseNumber.toUpperCase()
        ) {
          return false;
        }

        const resultCity = normalize(
          location.city ||
            location.town ||
            location.village ||
            location.municipality ||
            ""
        );

        if (resultCity !== expectedCity) {
          return false;
        }

        if (normalize(location.state || "") !== expectedState) {
          return false;
        }

        if (
          expectedZip &&
          location.postcode?.replace(/\s/g, "").toUpperCase() !==
            expectedZip
        ) {
          return false;
        }

        return true;
      });

      if (verified) {
        return NextResponse.json({
          latitude: Number(verified.lat),
          longitude: Number(verified.lon),
          matched_address: verified.display_name || query,
          source: "nominatim",
        });
      }
    }

    return NextResponse.json(
      {
        error:
          "Address could not be verified. Check the street address, city, state and ZIP code.",
      },
      { status: 404 }
    );
  } catch (error) {
    console.error("GEOCODE API ERROR:", error);

    return NextResponse.json(
      { error: "Unable to geocode address." },
      { status: 500 }
    );
  }
}
