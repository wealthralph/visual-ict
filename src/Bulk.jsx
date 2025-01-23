import Papa from "papaparse";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Flex,
  Group,
  Input,

  Stack,
  Table,
  Text,
} from "@mantine/core";
import {
  IconEdit,
  IconFileTypeCsv,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import BulkModal from "./BulkModal";
import { axiosClient } from "./axiosClient";
import { useMutation } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { useEffect } from "react";

function Bulk() {
  const [opened, { open, close }] = useDisclosure(false);
  const [tableData, setTableData] = useState([]);
  const [fileName, setFileName] = useState(null);

 useEffect(() => {
   const savedFileName = localStorage.getItem("fileName");
   const savedTableData = localStorage.getItem("tableData");
   const savedProcessingTableData = localStorage.getItem("processingTableData");

   if (savedFileName && savedTableData && savedProcessingTableData) {
     setFileName(savedFileName);
     setTableData(JSON.parse(savedTableData));
   }
 }, []);

 const handleFileDrop = (files) => {
   const file = files[0];
   if (file) {
     setFileName(file.name);
     localStorage.setItem("fileName", file.name);

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
           localStorage.setItem("tableData", JSON.stringify(initialData));
           localStorage.setItem(
             "processingTableData",
             JSON.stringify(initialData)
           );
         },
       });
     };
     reader.readAsText(file);
   }
 };

  const clearFile = () => {
    setFileName(null);
    setTableData([]);
    localStorage.removeItem("fileName");
    localStorage.removeItem("tableData");
    localStorage.removeItem("processingTableData");
  };

  const { isPending, mutateAsync } = useMutation({
    mutationFn: async function (row) {
      return await axiosClient.post("/activate", {
        accountNumber: row.accountNumber,
        pin: row.pin,
      });
    },
    onSuccess: (data, row) => {
      setTableData((prevData) =>
        prevData.map((item) =>
          item.id === row.id ? { ...item, status: "success" } : item
        )
      );
      notifications.show({
        color: "green",
        message: `Card Activated`,
      });

      setTableData((prevData) =>
        prevData.map((item) =>
          item.accountNumber === row.accountNumber
            ? { ...item, status: "failed" }
            : item
        )
      );
    },
    onError: (error, row) => {
      notifications.show({
        message: `Failed to activate card with ${row.accountNumber} and ${row.pin}`,
        color: "red",
      });

      console.log(row.id);

      setTableData((prevData) =>
        prevData.map((item) =>
          item.accountNumber === row.accountNumber
            ? { ...item, status: "failed" }
            : item
        )
      );
    },
  });

  const handleSubmitBulk = async () => {
    for (const row of tableData) {
      mutateAsync(row);
    }
  };

  const handleManualSubmit = (data) => {
    setTableData((prevData) => [...prevData, ...data]);
  };

  return (
    <>
      <BulkModal
        opened={opened}
        close={close}
        setTableData={setTableData}
        onSubmit={handleManualSubmit}
      />
      <Box w={"100%"}>
        <Stack w={"100%"}>
          {tableData.length > 0 ? (
            <Box w={"100%"}>
              <Flex justify="space-between" align="center" gap={"xl"} w={""}>
                {!fileName ? (
                  <Group gap={"xs"}>
                    <ActionIcon
                      variant="light"
                      color="gray"
                      onClick={open}
                      title="Clear file"
                      disabled={isPending}
                    >
                      <IconEdit size={18} />
                    </ActionIcon>
                    <Text size="md">Edit Data </Text>
                  </Group>
                ) : (
                  <Group gap={"xs"}>
                    <Text size="md">Selected File: </Text>
                    <Badge radius={"sm"} variant="light">
                      {fileName}
                    </Badge>
                  </Group>
                )}

                <Group>
                  <ActionIcon
                    variant="light"
                    color="red"
                    onClick={clearFile}
                    title="Clear file"
                    disabled={isPending}
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                  <Button
                    size="xs"
                    disabled={isPending}
                    onClick={handleSubmitBulk}
                    loading={isPending}
                  >
                    Submit Bulk
                  </Button>
                </Group>
              </Flex>
            </Box>
          ) : null}
          {!tableData.length && (
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
          )}

          {!fileName && tableData.length === 0 && (
            <Box>
              <Button onClick={open}>Upload Bulk Manually</Button>
              <Input.Description my={"md"}>
                Use this when you want to make a bulk activation manually
                inputting multiple values
              </Input.Description>
            </Box>
          )}

          {tableData.length > 0 && (
            <Table
              highlightOnHover
              mt="md"
              striped
              withTableBorder
              withColumnBorders
            >
              <Table.Thead>
                <Table.Tr>
                  {Object.keys(tableData[0]).map((key) => (
                    <Table.Th key={key}>{key}</Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {tableData.map((row, index) => (
                  <Table.Tr key={index}>
                    {Object.values(row).map((value, idx) => {
                      switch (value) {
                        case "pending":
                          return (
                            <Table.Td key={idx}>
                              <Badge color="yellow" size="xs" radius={"sm"}>
                                pending
                              </Badge>
                            </Table.Td>
                          );
                        case "failed":
                          return (
                            <Table.Td key={idx}>
                              <Badge color="red" size="xs" radius={"sm"}>
                                failed
                              </Badge>
                            </Table.Td>
                          );
                        case "success":
                          return (
                            <Table.Td key={idx}>
                              <Badge color="green" size="xs" radius={"sm"}>
                                Success
                              </Badge>
                            </Table.Td>
                          );
                        default:
                          return <Table.Td key={idx}>{value}</Table.Td>;
                      }
                    })}
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

export default Bulk;
