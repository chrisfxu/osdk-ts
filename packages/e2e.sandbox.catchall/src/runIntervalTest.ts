/*
 * Copyright 2026 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { IntervalRule } from "@osdk/api";
import { BoundariesUsState } from "@osdk/e2e.generated.catchall";
import invariant from "tiny-invariant";
import { client } from "./client.js";

const expectedStateCode = "MA";

export async function runIntervalTest(): Promise<void> {
  const states = client(BoundariesUsState);

  const positiveCases: Array<{ name: string; rule: IntervalRule }> = [
    {
      name: "match",
      rule: {
        $match: "MA",
        $ordered: true,
      },
    },
    {
      name: "prefixOnLastTerm",
      rule: {
        $match: "M",
        $prefixOnLastTerm: true,
      },
    },
    {
      name: "and",
      rule: {
        $and: [
          {
            $match: "MA",
            $ordered: true,
          },
        ],
        $ordered: true,
      },
    },
    {
      name: "or",
      rule: {
        $or: [
          {
            $match: "ZZ",
            $ordered: true,
          },
          {
            $match: "MA",
            $ordered: true,
          },
        ],
      },
    },
  ];

  for (const testCase of positiveCases) {
    const response = await states
      .where({
        usState: {
          $interval: testCase.rule,
        },
      })
      .fetchPage();

    const matchedStates = response.data.map((state) => state.usState);
    const matchedStatesSummary = JSON.stringify(matchedStates);
    console.log(`Interval ${testCase.name} states:`, matchedStates);

    invariant(
      matchedStates.includes(expectedStateCode),
      `Expected ${expectedStateCode} for ${testCase.name}; got ${matchedStatesSummary}`,
    );
  }

  const noMatch = await states
    .where({
      usState: {
        $interval: {
          $match: "ZZ",
          $ordered: true,
        },
      },
    })
    .fetchPage();

  const impossibleMatches = noMatch.data.map((state) => state.usState);
  const impossibleMatchesSummary = JSON.stringify(impossibleMatches);
  console.log("Interval no-match states:", impossibleMatches);
  invariant(
    impossibleMatches.length === 0,
    `Expected no matches; got ${impossibleMatchesSummary}`,
  );
}

void runIntervalTest();
