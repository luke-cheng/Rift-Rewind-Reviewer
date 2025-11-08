import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Match: a
    .model({
      matchId: a.string().required(),
      puuid: a.string().required(),
      gameCreation: a.integer().required(),
      matchData: a.json().required(),
      region: a.string().required(),
      processedAt: a.integer(),
      aiInsights: a.json(),
    })
    .secondaryIndexes((index) => [
      index("puuid").sortKeys(["gameCreation"]),
    ])
    .authorization((allow) => [allow.publicApiKey()]),

  PlayerStat: a
    .model({
      puuid: a.string().required(),
      region: a.string().required(),
      riotId: a.json(),
      totalMatches: a.integer(),
      wins: a.integer(),
      losses: a.integer(),
      winRate: a.float(),
      avgKDA: a.json(),
      avgCS: a.float(),
      avgDamage: a.float(),
      avgVisionScore: a.float(),
      championStats: a.json(),
      roleStats: a.json(),
      lastUpdated: a.integer(),
      lastMatchFetched: a.integer(),
      aiInsights: a.json(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
