
// @ts-check

import { join } from "path";
import { copyFileSync, readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import GDPRWebhookHandlers from "./gdpr.js";

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT, 10);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

//adding this section to check the web
app.get("/apps/cart-discount/name",(req,resp)=>{
  resp.status(200).json("getting your request")
})

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());

app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);

app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers })
);

// All endpoints after this point will require an active session
app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

console.log("----------------------------")

app.post("/api/products/",async (req,resp)=>{

  console.log("Key----------------------- ",Object.keys(req.query));
  // const productArr = await shopify.api.rest.Product.all({
  //   session:resp.locals.shopify.session,
  // })

  //string to fetch the new data
  // console.log("body -------------- ",);

  const dataBody = req.body

  
  let searchQuery = "";
  dataBody.type==null?
    searchQuery = `first : 10` 
    :searchQuery = `${dataBody.type=="before"?"last":"first"}:${dataBody.quantity},${dataBody.type}:"${dataBody.cursor}"`

    // console.log("searchQueryb ", searchQuery);

  const client = new shopify.api.clients.Graphql({
     session : resp.locals.shopify.session 
    });

  const products_data = await client.query({
    data: {
      query: `
      {
        products(${searchQuery} ) {
              nodes {
            title 
            legacyResourceId
            variants(first: 10) {
              nodes {
                price
                weight
              }
            }
          }
          pageInfo {
            hasPreviousPage
            hasNextPage
            startCursor
            endCursor
          }
        }
      }
      `
    },
  });

  console.log()
  resp.status(200).send(products_data.body.data.products);
  
})
// 
app.get("/api/products/count", async (_req, res) => {

  const countData = await shopify.api.rest.Product.count({
    session: res.locals.shopify.session,
  });

  // let payment = await 
  // console.log("countData", shopify.api.rest.Product);
  res.status(200).send(countData);
  
});

app.get("/api/products/create", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }

  res.status(status).send({ success: status === 200, error });
});

app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);
