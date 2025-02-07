import {
  ActionIcon,
  Badge,
  Box,
  Drawer,
  Flex,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";

import Admin from "./Admin";
import Bulk from "./Bulk";
import Single from "./Single";
import { IconSettings } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import Settings from "./Settings";

const data = [{ label: "Providus" }, { label: "Interswitch" }];

function App() {
  const [value, setValue] = useState("bulk");
  const [mode, setmode] = useState(data[0]);
  const [opened, { open, close }] = useDisclosure(false);

  const savedMode = localStorage.getItem("mode");
  const config = localStorage.getItem("config");
  useEffect(() => {
    if (!savedMode) {
      localStorage.setItem("mode", data[0].label);
    }

    if (!config) {
      localStorage.setItem(
        "config",
        JSON.stringify({
          retry_failed: true,
          enable_data_batching: true,
          csv_data_length: 150,
          batch_size: 20,
        })
      );
    }
  }, []);

  return (
    <>
      <Drawer
        offset={8}
        radius="md"
        opened={opened}
        onClose={close}
        title="Settings"
        position="right"
      >
        <Settings setMode={setmode} mode={mode} />
      </Drawer>
      <Stack h={"100%"} align="center" py={"xl"}>
        <Flex
          justify={"space-between"}
          align={"center"}
          maw={"500px"}
          w={"100%"}
        >
          <Title order={4} fw={"normal"}>
            Activate Card
          </Title>
          <Group gap={"xs"}>
            <ActionIcon
              size={"sm"}
              variant="subtle"
              color="gray"
              onClick={open}
            >
              <IconSettings />
            </ActionIcon>
          </Group>
        </Flex>
        <Paper radius={"md"} withBorder miw={500} shadow="xs" p={"md"}>
          <Stack align="center">
            <Flex justify={"space-between"} w={"100%"}>
              <SegmentedControl
                size="xs"
                onChange={setValue}
                data={[
                  { label: "Bulk ", value: "bulk" },
                  {
                    label: "Single ",
                    value: "single",
                    disabled: false,
                  },
                ]}
              />
              <Group>
                <Text>
                  Mode:{" "}
                  <Badge variant="light" size="sm" radius={"sm"}>
                    {savedMode}
                  </Badge>
                </Text>
              </Group>
            </Flex>
            <Box w={"100%"}>{value === "bulk" && <Bulk />}</Box>
            <Box w={"100%"}>{value === "single" && <Single />}</Box>
          </Stack>
        </Paper>
      </Stack>
    </>
  );
}

export default App;
