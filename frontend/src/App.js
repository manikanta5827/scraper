import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Input,
  Stack,
  Text,
  Image,
  VStack,
  Heading,
  Center,
  Spinner,
} from "@chakra-ui/react";

import Loading from "./Loading";

const LoadingScreen = () => (
  <Center h="100vh" flexDirection="column">
    <Loading />
    <Text color="gray.600" fontSize={20} fontWeight="bold">
      Cracking military-grade encryption...
    </Text>
  </Center>
);

function redirect(link) {
  window.open(link, "_blank");
}

const App = () => {
  const [domain, setDomain] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setDomain(e.target.value);
  };

  const handleScrape = async () => {
    if (domain === "") {
      alert("Please Enter a domain");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:4000/scrape", {
        url: domain,
      });
      setResults(response.data);
    } catch (error) {
      console.error("Error scraping the website:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={4} maxW="600px" mx="auto" minH="100vh">
      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="xl" textAlign="center">
          Web Scraper
        </Heading>
        <label htmlFor="domain" style={{ fontSize: 12, fontWeight: "bold" }}>
          Domain Name
        </label>

        <Input
          placeholder="skindulge.in"
          value={domain}
          onChange={handleInputChange}
          size="lg"
          borderColor="gray.400"
          _placeholder={{ color: "gray.500", fontWeight: "bold" }}
          width="100%"
          name="domain"
          style={{ height: 40 }}
          paddingRight={10}
          fontSize={16}
          dir="rtl"
          fontWeight="bold"
        />
        <Button
          onClick={handleScrape}
          size="lg"
          bg="royalblue"
          color="white"
          fontWeight="bold"
          border="none"
          width="100%"
          borderRadius={10}
          height={40}
          cursor="pointer"
        >
          Start Scraping
        </Button>
        {loading ? (
          <LoadingScreen />
        ) : results.length > 0 ? (
          <Stack spacing={7} mt={10}>
            {results.map((item, index) => (
              <div
                key={index}
                onClick={() => redirect(item.loc)}
                style={{
                  backgroundColor: "white",
                  display: "flex",
                  alignItems: "center",
                  spacing: 10,
                  width: "100%",
                  maxWidth: "600px",
                  mx: "auto",
                  border: "2px solid",
                  padding: "10px",
                  borderColor: "gray",
                  borderRadius: "2px",
                  spacing: "10px",
                  cursor: "pointer",
                  transition: "0.3s",
                  ":hover": {
                    backgroundColor: "gray.200",
                    
                  },
                  boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2)"
                }}
              >
                <Stack spacing={2} flex="1">
                  <Heading as="h3" size="md">
                    {item.imageTitle}
                  </Heading>
                  <Text fontSize="md">{item.brief}</Text>
                </Stack>
                <div
                  style={{
                    border: "2px solid",
                    borderRadius: "8px",
                    borderColor: "gray",
                  }}
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.imageTitle}
                    borderRadius="md"
                    boxSize="150px"
                    objectFit="cover"
                    padding={10}
                    margin={0}
                  />
                </div>
              </div>
            ))}
          </Stack>
        ) : null}
      </VStack>
    </Box>
  );
};

export default App;
