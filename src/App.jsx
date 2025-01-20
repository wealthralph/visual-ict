import {
  Box,
  Container,
  Flex,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Title,
  Table,
  Button,
  Input,
  Modal,
  ActionIcon,
  Badge,
  Loader,
  TextInput,
  NumberInput,
} from "@mantine/core";
import "./App.css";
import { useState } from "react";
import PropTypes from "prop-types";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import {
  IconFileTypeCsv,
  IconPlus,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import Papa from "papaparse";
import { useDisclosure } from "@mantine/hooks";
import axios from "axios";
import { Controller, useFieldArray, useForm } from "react-hook-form";

const axiosClient = axios.create({
  baseURL: "https://core-api.tagpay.ng/v1/",
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_API_KEYS}`,
  },
  withCredentials: true,
});

function Single() {}

function BulkModal({ opened, close }) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      activate: [{ accountNumber: "", pin: 0 }],
    },
    mode: "onChange",
  });

  const { fields, append, prepend, remove, swap, move, insert, replace } =
    useFieldArray({
      control,
      name: "activate",
      rules: {
        minLength: 4,
      },
    });

  console.log(fields, "fields");

  return (
    <Modal opened={opened} onClose={close} size={"md"} title={"Activate Card"} p={'xs'}>
      <Stack align="center" w={'100%'}>
        <Stack  w={'100%'}>
          {fields.map((item, index) => (
            <Flex key={item.id} gap={'xs'} w={'100%'}  >
              <Controller
                render={({ field }) => (
                  <TextInput
                    {...field}
                    placeholder="Enter Account Number"
                    // label="Account Number"
                    required
                    size="xs"
                    radius={"sm"}
                    data-autofocus
                  />
                )}
                name={`activate.${index}.accountNumber`}
                control={control}
              />
              <Controller
                render={({ field }) => (
                  <NumberInput
                    {...field}
                    placeholder="Enter Pin"
                    // label="Pin"
                    required
                    size="xs"
                    radius={"sm"}
                  />
                )}
                name={`activate.${index}.pin`}
                control={control}
              />
              <ActionIcon
                variant="subtle"
                color="red.5"
                onClick={() => remove(index)}
                title="Remove"
                size={"md"}
              >
                <IconTrash size={18} />
              </ActionIcon>
            </Flex>
          ))}
        </Stack>
        <ActionIcon
          variant="default"
          color="red"
          onClick={append}
          title="Remove"
          size={"md"}
        >
          <IconPlus size={18} />
        </ActionIcon>
      </Stack>
    </Modal>
  );
}

function Bulk() {
  const [opened, { open, close }] = useDisclosure(false);
  const [tableData, setTableData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTableData, setProcessingTableData] = useState([]);
  const [fileName, setFileName] = useState(null);

  const handleFileDrop = (files) => {
    const file = files[0];
    if (file) {
      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = function (e) {
        const csv = e.target.result;

        // Parse CSV using PapaParse
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: function (result) {
            const initialData = result.data.map((row, index) => ({
              id: index,
              ...row,
              status: "pending",
            }));
            setTableData(initialData);
            //  setProcessingTableData(initialData);
          },
        });
      };
      reader.readAsText(file);
    }
  };

  const clearFile = () => {
    setFileName(null);
    setTableData([]);
    setProcessingTableData([]);
  };

  const handleSubmitBulk = async () => {
    const updatedTableData = [...tableData.slice(0, 15)];

    setIsProcessing(true);


    for (let i = 0; i < updatedTableData.length; i++) {
      const row = updatedTableData[i];
      updatedTableData[i] = { ...row, status: "processing" };
      setProcessingTableData([...updatedTableData]);

      const accountNumber = updatedTableData[i]?.accountNumber;
      const pin = updatedTableData[i]?.pin;

      try {
        const retrieveIdResponse = await axiosClient.post(
          `fip/card/${accountNumber}`
        );

           console.log("@RETRIEVE ID RESPONSE STATUS", retrieveIdResponse.status);
           console.log("@RETRIEVE ID RESPONSE DATA", retrieveIdResponse.data);

        if (response.status === 200 || response.data.status === true) {
          const payload = {
            cardId: retrieveIdResponse.data?.data.id,
            pin,
          };

          const changePinResponse = await axiosClient.post(
            `fip/card/pin`,
            JSON.stringify(payload)
          );

          console.log("@CHANGE PIN RESPONSE STATUS",changePinResponse.status)
          console.log("@CHANGE PIN RESPONSE DATA",changePinResponse.data)

          if (
            changePinResponse.status === 200 ||
            changePinResponse.data.status === true
          ) {
            updatedTableData[i] = { ...row, status: "success" };
          }
        }
      } catch (error) {
        updatedTableData[i] = { ...row, status: "failure" };
      }

      setProcessingTableData([...updatedTableData]);
    }

    setIsProcessing(false);
  };

  const tableDataDisplay =
    isProcessing && processingTableData.length > 0
      ? processingTableData
      : tableData;

  return (
    <>
      <BulkModal opened={opened} close={close} />
      <Box>
        <Stack>
          {!fileName ? (
            <Dropzone
              onDrop={handleFileDrop}
              onReject={(files) => console.log("Rejected files", files)}
              maxSize={5 * 1024 ** 2}
              accept={[MIME_TYPES.csv]}
            >
              <Group
                justify="center"
                gap="sm"
                mih={120}
                style={{ pointerEvents: "none" }}
              >
                <Dropzone.Accept>
                  <IconUpload
                    size={52}
                    color="var(--mantine-color-blue-6)"
                    stroke={1.5}
                  />
                </Dropzone.Accept>
                <Dropzone.Reject>
                  <IconX
                    size={52}
                    color="var(--mantine-color-red-6)"
                    stroke={1.5}
                  />
                </Dropzone.Reject>
                <Dropzone.Idle>
                  <IconFileTypeCsv
                    size={52}
                    color="var(--mantine-color-dimmed)"
                    stroke={1.5}
                  />
                </Dropzone.Idle>

                <div>
                  <Text size="xl" inline>
                    Drag CSV file here or click to select files
                  </Text>
                  <Text size="sm" c="dimmed" inline mt={7}>
                    Attach a single file, each file should not exceed 5MB
                  </Text>
                </div>
              </Group>
            </Dropzone>
          ) : (
            <Box>
              <Flex justify="space-between" align="center" gap={"xl"}>
                <Group gap={"xs"}>
                  <Text size="md">Selected File: </Text>
                  <Badge radius={"sm"} variant="light">
                    {fileName}
                  </Badge>
                </Group>
                <Group>
                  <ActionIcon
                    variant="light"
                    color="red"
                    onClick={clearFile}
                    title="Clear file"
                    disabled={isProcessing}
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                  <Button
                    size="xs"
                    disabled={isProcessing}
                    onClick={handleSubmitBulk}
                    loading={isProcessing}
                  >
                    Submit Bulk
                  </Button>
                </Group>
              </Flex>
            </Box>
          )}

          {!fileName && (
            <Box>
              <Button onClick={open}>Upload Bulk Manually</Button>
              <Input.Description my={"md"}>
                Use this when you want to make a bulk activation manually
                inputing multiple values
              </Input.Description>
            </Box>
          )}

          {tableDataDisplay.length > 0 && (
            <Table
              highlightOnHover
              mt="md"
              striped
              withTableBorder
              withColumnBorders
            >
              <Table.Thead>
                <Table.Tr>
                  {Object.keys(tableDataDisplay[0]).map((key) => (
                    <Table.Th key={key}>{key}</Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {tableDataDisplay.slice(0, 15).map((row, index) => (
                  <Table.Tr key={index}>
                    {Object.values(row).map((value, idx) => (
                      <Table.Td key={idx}>{value}</Table.Td>
                    ))}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Stack>
      </Box>
    </>
  );
}

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
                { label: "Single Activation", value: "single" },
              ]}
            />
          </Flex>
          <Box>{value === "bulk" ? <Bulk /> : <Single />}</Box>
        </Stack>
      </Paper>
    </Stack>
  );
}

export default App;
