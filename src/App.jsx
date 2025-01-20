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
} from "@mantine/core";
import "./App.css";
import { useState } from "react";
import PropTypes from "prop-types";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import { IconFileTypeCsv, IconTrash, IconUpload, IconX } from "@tabler/icons-react";
import Papa from "papaparse";
import { useDisclosure } from "@mantine/hooks";
import axios from "axios"

function Single() {}

function BulkModal({ opened, close }) {
  return (
    <Modal opened={opened} onClose={close} title="Card Activation">
      {/* Modal content */}
    </Modal>
  );
}

function Bulk() {
  const [opened, { open, close }] = useDisclosure(false);
 const [tableData, setTableData] = useState([]);
 const [isProcessing, setIsProcessing] = useState(false)
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
             status: "idle",
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
  const updatedTableData = [...tableData.slice(0, 100)];

  setIsProcessing(true)

  for (let i = 0; i < updatedTableData.length; i++) {
    const row = updatedTableData[i];
    updatedTableData[i] = { ...row, status: "loading" };
    setProcessingTableData([...updatedTableData]);

      let timeoutId;


    try {
       // Simulating API call with a delay
      timeoutId = setTimeout(() => {
        // Simulating API call with axios
        // const response = await axios.post("/api/activate", row);
        // if (response.status === 200) {
        //   updatedTableData[i] = { ...row, status: "success" };
        // } else {
        //   updatedTableData[i] = { ...row, status: "failure" };
        // }

        console.log(updatedTableData[i], "processing");
        updatedTableData[i] = { ...row, status: "success" }; // Assuming success for simulation
        setProcessingTableData([...updatedTableData]);
      }, 3000);

      await new Promise((resolve) => timeoutId);// Assuming success for simulation
    } catch (error) {
            clearTimeout(timeoutId);

      updatedTableData[i] = { ...row, status: "failure" };
    }

    setProcessingTableData([...updatedTableData]);
  }

  setIsProcessing(false)
};


const tableDataDisplay = isProcessing ? processingTableData : tableData

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
              <Flex justify="space-between" align="center">
                <Group gap={'xs'}>
                  <Text size="md">Selected File: </Text>
                  <Badge radius={'sm'} variant="light" >{fileName}</Badge>
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
                  <Button size="xs" onClick={handleSubmitBulk}>Submit Bulk</Button>
                </Group>
              </Flex>
            </Box>
          )}

          {!fileName && (
            <Box>
              <Button onClick={open} >Upload Bulk Manually</Button>
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
                {tableDataDisplay.slice(0, 50).map((row, index) => (
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
