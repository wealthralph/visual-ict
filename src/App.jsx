import {
  ActionIcon,
  Box,
  Flex,
  Group,
  Image,
  Menu,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import classes from  "./App.module.css";
import { useEffect, useState } from "react";

import Admin from "./Admin";
import Bulk from "./Bulk";
import Single from "./Single";
import { IconChevronDown, IconSettings } from "@tabler/icons-react";


  const data = [{ label: "Providus" }, { label: "Interswitch" }];

function App() {
  const [value, setValue] = useState("bulk");
   const [opened, setOpened] = useState(false);
   const [mode, setmode] = useState(data[0]);


     useEffect(() => {
       const savedMode = localStorage.getItem("mode");
       if (savedMode) {
         const parsedMode = JSON.parse(savedMode);
         setmode(parsedMode);
       } else {
         setmode(data[0]); // Default to "Providus"
         localStorage.setItem("mode", JSON.stringify(data[0]));
       }
     }, []);

     const handleSelect = (item) => {
       setmode(item);
       localStorage.setItem("mode", JSON.stringify(item));
     };

     const items = data.map((item) => (
       <Menu.Item
         //  leftSection={<Image src={item.image} width={18} height={18} />}
         onClick={() => handleSelect(item)}
         key={item.label}
       >
         {item.label}
       </Menu.Item>
     ));






  return (
    <Stack h={"100%"} align="center" py={"xl"}>
      <Flex justify={"space-between"} align={"center"} maw={"500px"} w={"100%"}>
        <Title order={4} fw={"normal"}>
          Activate Card
        </Title>
        <Group gap={'xs'}>
          <Menu
            onOpen={() => setOpened(true)}
            onClose={() => setOpened(false)}
            radius="md"
            width="target"
            withinPortal
          >
            <Menu.Target>
              <UnstyledButton
                className={classes.control}
                data-expanded={opened || undefined}
              >
                <Group gap={"4px"}>
                  <Group gap="xs">
                    {/* <Image src={selected.image} width={22} height={22} /> */}
                    <span className={classes.label}>{mode.label}</span>
                  </Group>
                  <IconChevronDown
                    size={14}
                    className={classes.icon}
                    stroke={1.5}
                  />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>{items}</Menu.Dropdown>
          </Menu>
          <ActionIcon size={"sm"} variant="subtle" color="gray">
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
          </Flex>
          <Box w={"100%"}>{value === "bulk" && <Bulk />}</Box>
          <Box w={"100%"}>{value === "single" && <Single />}</Box>
        </Stack>
      </Paper>
    </Stack>
  );
}

export default App;
