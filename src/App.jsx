import {
  Box,
  Flex,
  Paper,
  SegmentedControl,
  Stack,
  Title,
} from "@mantine/core";
import "./App.css";
import { useState } from "react";

import Admin from "./Admin";
import Bulk from "./Bulk";
import Single from "./Single";

function App() {
  const [value, setValue] = useState("bulk");

  return (
    <Stack h={"100%"} align="center" py={"xl"}>
      <Title order={2}>Activate Card</Title>
      <Paper radius={"md"} withBorder miw={500} shadow="xs" p={"md"}>
        <Stack align="center">
          <Flex justify={"center"} w={"100%"}>
            <SegmentedControl
              size="sm"
              onChange={setValue}
              data={[
                { label: "Bulk Activation", value: "bulk" },
                {
                  label: "Single Activation",
                  value: "single",
                  disabled: false,
                },
                { label: "Admin", value: "admin" },
              ]}
            />
          </Flex>
          <Box w={"100%"}>{value === "bulk" && <Bulk />}</Box>
          <Box w={"100%"}>{value === "single" && <Single />}</Box>
          <Box w={"100%"}>{value === "admin" && <Admin />}</Box>
        </Stack>
      </Paper>
    </Stack>
  );
}

export default App;
