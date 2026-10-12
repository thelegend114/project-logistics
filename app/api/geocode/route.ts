import { NextResponse } from "next/server";

type GeocodeRequest = {
  address: string;
  city: string;
  state: string;
};

type CensusGeocodeResponse = {
  result?: {
    addressMatches?: Array<{
      coordinates?: {
        x?: number;
        y?: number;
      };
    }>;
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GeocodeRequest;

    const address = body.address?.trim();
    const city = body.city?.trim();
    const state = body.state?.trim();

    if (!address || !city || !state) {
      return NextResponse.json(
        {
          error:
            "Address, city and state are required.",
        },
        { status: 400 }
      );
    }

    /*
     * U.S. Census Geocoder
     *
     * The Census geocoder is a better primary source for
     * U.S. street addresses because it accepts the address,
     * city and state directly and returns interpolated
     * longitude/latitude coordinates.
     */
    const censusUrl =
      "https://geocoding.geo.census.gov/geocoder/locations/address?" +
      new URLSearchParams({
        street: address,
        city,
        state,
        benchmark: "Public_AR_Current",
        format: "json",
      }).toString();

    const censusResponse = await fetch(censusUrl, {
      cache: "no-store",
    });

    if (censusResponse.ok) {
      const censusData =
        (await censusResponse.json()) as CensusGeocodeResponse;

      const match =
        censusData.result?.addressMatches?.[0];

      const latitude = Number(
        match?.coordinates?.y
      );

      const longitude = Number(
        match?.coordinates?.x
      );

      if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude)
      ) {
        return NextResponse.json({
          latitude,
          longitude,
        });
      }
    }

    /*
     * Fallback to Nominatim/OpenStreetMap.
     *
     * We keep this fallback so that an address that is not
     * available in the Census address database can still be
     * resolved by another geocoder.
     */
    const queries = [
      `${address}, ${city}, ${state}, USA`,
      `${address}, ${city}, ${state}`,
      `${address}, ${city}, ${state} USA`,
    ];

    for (const query of queries) {
      const nominatimUrl =
        "https://nominatim.openstreetmap.org/search?" +
        new URLSearchParams({
          q: query,
          format: "jsonv2",
          limit: "1",
          countrycodes: "us",
        }).toString();

      const response = await fetch(
        nominatimUrl,
        {
          headers: {
            "User-Agent":
              "ProjectLogistics/1.0",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        continue;
      }

      const results = await response.json();

      if (
        !Array.isArray(results) ||
        results.length === 0
      ) {
        continue;
      }

      const latitude = Number(
        results[0]?.lat
      );

      const longitude = Number(
        results[0]?.lon
      );

      if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude)
      ) {
        return NextResponse.json({
          latitude,
          longitude,
        });
      }
    }

    return NextResponse.json(
      {
        error:
          "Address could not be geocoded.",
      },
      { status: 404 }
    );
  } catch (error) {
    console.error(
      "GEOCODE API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to geocode address.",
      },
      { status: 500 }
    );
  }
}