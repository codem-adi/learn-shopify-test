import {
  Card,
  Page,
  Layout,
  TextContainer,
  Image,
  Stack,
  Link,
  Heading,
  IndexTable,
  useIndexResourceState,
  ChoiceList,
  Pagination,
} from "@shopify/polaris";

import { useState, useCallback, useEffect } from "react";
import { TitleBar } from "@shopify/app-bridge-react";

import { trophyImage } from "../assets";
import { useAuthenticatedFetch } from "../hooks";
import { ProductsCard } from "../components";

export default function HomePage() {
  
  const [selected, setSelected] = useState(["hidden"]);
  const [products, setProducts] = useState([]); 
  const [pageInfo = {},setPageInfo]= useState({});

  const fetch = useAuthenticatedFetch();

  const handleChange = useCallback((value) => setSelected(value), []);

  const getProducts = async (quantity,type,cursor) => {
    console.log("calling the getProduct ");
    const response = await fetch(`/api/products/`,{
      method : "POST",
      headers : {
        "Content-Type":"application/json"
      },
      body :JSON.stringify({
        quantity : quantity,
        type:type,
        cursor:cursor
      })
    });

    let data = await response.json()
    console.log("data is  ",data.nodes)
    setProducts(data.nodes);
    setPageInfo(data.pageInfo)
  };

  useEffect(() => {
    console.log("render")
    getProducts(10,null,null);
  }, []);

  // const products = [
  //   {
  //     id: "3411",
  //     url: "products/341",
  //     name: "Mae Jemison",
  //     location: "Decatur, USA",
  //     orders: 20,
  //     amountSpent: "$2,400",
  //   },
  //   {
  //     id: "2561",
  //     url: "products/256",
  //     name: "Ellen Ochoa",
  //     location: "Los Angeles, USA",
  //     orders: 30,
  //     amountSpent: "$140",
  //   },
  // ];

  // console.log(products);

  const resourceName = {
    singular: "customer",
    plural: "products",
  };

  const resourceIDResolver = (products) => {
    return products.legacyResourceId
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(products,{resourceIDResolver,});

  const rowMarkup = products.map(
    ({ legacyResourceId : id,title : name,variants }, index) => {
      return (
        <IndexTable.Row
          id={id}
          key={id}
          selected={selectedResources.includes(id)}
          position={index}
          >
            {console.log("id ------ ",id)}
            {console.log("selectedResources ------ ",selectedResources)}
          <IndexTable.Cell>
            <p variant="bodyMd" fontWeight="bold" as="span">
              {name}
            </p>
          </IndexTable.Cell>
          <IndexTable.Cell>{variants.nodes[0].weight}</IndexTable.Cell>
          <IndexTable.Cell>{variants.nodes[0].price}</IndexTable.Cell>
          <IndexTable.Cell>No Status</IndexTable.Cell>
        </IndexTable.Row>
      );
    }
  );

  return (
    <Page narrowWidth>
      <TitleBar title="App name" primaryAction={null} />

      {/* <Layout>
        <Card>
          <ChoiceList
            title="Company name"
            choices={[
              { label: "Hidden", value: "hidden" },
              { label: "Optional", value: "optional" },
              { label: "Required", value: "required" },
            ]}
            selected={selected}
            onChange={handleChange}
          >
          </ChoiceList>
        </Card>
      </Layout> */}

      <Layout>
        <Layout.Section>
          <Card>
            <IndexTable
              resourceName={resourceName}
              itemCount={products.length}
              selectedItemsCount={
                allResourcesSelected ? "All" : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              headings={[
                { title: "Name" }, //title
                { title: "Weight" }, //price
                { title: "Price" }, //weight
                { title: "Status" }, // images/src
              ]}
            >
              {rowMarkup}
            </IndexTable>
          </Card>

          <Pagination
            hasPrevious
            onPrevious={() => {
              pageInfo.hasPreviousPage?
              getProducts(10,"before",pageInfo.startCursor):alert("don't have the previous page")
            }}
            hasNext
            onNext={() => {
              pageInfo.hasNextPage?getProducts(10,"after",pageInfo.endCursor):alert("don't have the next page")
            }}
          />
        </Layout.Section>

        <Layout.Section>  
          <Card sectioned>
            <Stack
              wrap={false}
              spacing="extraTight"
              distribution="trailing"
              alignment="center"
            >
              <Stack.Item fill>
                <TextContainer spacing="loose">
                  <Heading>Nice work on building a Shopify app 🎉</Heading>
                  <p>
                    Your app is ready to explore! It contains everything you
                    need to get started including the{" "}
                    <Link url="https://polaris.shopify.com/" external>
                      Polaris design system
                    </Link>
                    ,{" "}
                    <Link url="https://shopify.dev/api/admin-graphql" external>
                      Shopify Admin API
                    </Link>
                    , and{" "}
                    <Link
                      url="https://shopify.dev/apps/tools/app-bridge"
                      external
                    >
                      App Bridge
                    </Link>{" "}
                    UI library and components.
                  </p>
                  <p>
                    Ready to go? Start populating your app with some sample
                    products to view and test in your store.{" "}
                  </p>
                  <p>
                    Learn more about building out your app in{" "}
                    <Link
                      url="https://shopify.dev/apps/getting-started/add-functionality"
                      external
                    >
                      this Shopify tutorial
                    </Link>{" "}
                    📚{" "}
                  </p>
                </TextContainer>
              </Stack.Item>
              <Stack.Item>
                <div style={{ padding: "0 20px" }}>
                  <Image
                    source={trophyImage}
                    alt="Nice work on building a Shopify app"
                    width={120}
                  />
                </div>
              </Stack.Item>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <ProductsCard />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
