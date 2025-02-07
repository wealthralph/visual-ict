import {
  Box,
  Divider,
  Flex,
  Group,
  NumberInput,
  Radio,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import { useEffect, useState } from "react";
import classes from "./App.module.css";

const data = [
  {
    label: "Providus",
    description: "Bulk actiation for Providus cards",
  },
  {
    label: "Interswitch",
    description: "Bulk activation for Interswitch cards",
  },
];

const Settings = () => {
  const mode = localStorage.getItem("mode");
  const configurations = JSON.parse(localStorage.getItem("config"));


  const [value, setValue] = useState(mode);
  const [config, setConfig] = useState(configurations);

//   console.log(config, "this is checked");

  useEffect(() => {
    localStorage.setItem("config", JSON.stringify(config));
  }, [config]);

  const cards = data.map((item) => (
    <Radio.Card
      className={classes.root}
      radius="md"
      value={item.label}
      key={item.label}
      p={"sm"}
      checked={mode === item.label}
    >
      <Group wrap="nowrap" align="flex-start">
        <Radio.Indicator />
        <div>
          <Text className={classes.label}>{item.label}</Text>
          <Text className={classes.description}>{item.description}</Text>
        </div>
      </Group>
    </Radio.Card>
  ));
  return (
    <Stack gap={"xl"}>
      {/* Mode */}
      <Box>
        <Radio.Group
          value={value}
          onChange={(value) => {
            setValue(value);
            localStorage.setItem("mode", value);
          }}
          label="Select a mode"
          description="Mode determines what provider will be used for card activations."
        >
          <Stack pt="md" gap="xs">
            {cards}
          </Stack>
        </Radio.Group>
      </Box>
      <Stack>
        <Divider labelPosition="left" label={"Bulk Activation Config"} />
        <Flex justify={"space-between"}>
          <Box>
            <Text size="sm">Retry Failed Activation</Text>
            <Text c={"dimmed"} size="xs">
              When enabled, data will be processed in batches to optimize
              performance during bulk card activations.
            </Text>
          </Box>
          <Switch
            checked={config.retry_failed}
            
            onChange={(event) => {

                console.log(event.currentTarget.value, "current traget")
                console.log(event.target.checked, "target")
              setConfig((prevConfig) => {
                return {
                    ...prevConfig,
                    retry_failed: event.target?.checked,
                };
              });
            }}
          />
        </Flex>
        <Flex justify={"space-between"}>
          <Box>
            <Text size="sm">Enable data batching for bulk activation</Text>
            <Text c={"dimmed"} size="xs">
              When enabled, data will be processed in batches to optimize
              performance during bulk card activations.
            </Text>
          </Box>
          <Switch
            checked={config.enable_data_batching}
            onChange={(event) => {
              setConfig((prevConfig) => {
                return {
                  ...prevConfig,
                  enable_data_batching: event.target?.checked,
                };
              });
            }}
          />
        </Flex>
        <Flex gap={"xl"} justify={"space-between"}>
          <Box>
            <Text size="sm">Set CSV Data Length Trigger</Text>
            <Text c={"dimmed"} size="xs">
              Specify the minimum number of data entries required in the CSV
              file to trigger batching.
            </Text>
          </Box>
          <NumberInput
            w={100}
            size="xs"
            radius={"md"}
            variant="default"
            value={config.csv_data_length}
            onChange={(num) => {
              setConfig((prevConfig) => {
                return {
                  ...prevConfig,
                  csv_data_length: num,
                };
              });
            }}
          />
        </Flex>
        <Flex gap={"xl"} justify={"space-between"}>
          <Box>
            <Text size="sm">Set Batch Size</Text>
            <Text c={"dimmed"} size="xs">
              Specify the number of cards to be processed in each batch. This is
              for performance.
            </Text>
          </Box>
          <NumberInput
            w={100}
            size="xs"
            radius={"md"}
            variant="default"
            value={config.batch_size}
            onChange={(num) => {
              setConfig((prevConfig) => {
                return {
                  ...prevConfig,
                  batch_size: num,
                };
              });
            }}
          />
        </Flex>
      </Stack>
    </Stack>
  );
};

export default Settings;
