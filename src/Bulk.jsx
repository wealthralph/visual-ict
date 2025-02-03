import Papa from "papaparse";
import { useDisclosure } from "@mantine/hooks";
import { useRef, useState } from "react";
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationErrors, setValidationErrors] = useState("");
   const prevModeRef = useRef();

              const mode = JSON.parse(localStorage.getItem("mode"));


  useEffect(() => {
    const savedFileName = localStorage.getItem("fileName");
    const savedTableData = localStorage.getItem("tableData");

    if (savedFileName && savedTableData) {
      setFileName(savedFileName);
      setTableData(JSON.parse(savedTableData));
    }
  }, []);

  useEffect(() => {
    if (prevModeRef.current && prevModeRef.current !== mode) {
         localStorage.removeItem("fileName");
         localStorage.removeItem("tableData");
    }
    prevModeRef.current = mode;
  }, [mode]);

  const handleFileDrop = (files) => {
    const file = files[0];
    if (file) {
      setFileName(file.name);
      setSelectedFile(file);

      localStorage.setItem("fileName", file.name);

      const reader = new FileReader();
      reader.onload = function (e) {
        const csv = e.target.result;

        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: function (result) {


            if (mode?.label === "Interswitch") {
              const requiredFields = ["cvv", "expiry", "cardpan", "newPin"];
              const missingFields = requiredFields.filter(
                (field) => !result.meta.fields.includes(field)
              );

              if (missingFields.length > 0) {
                setValidationErrors(
                  `Missing required fields: ${missingFields.join(", ")}`
                );
                notifications.show({
                  message: `Missing required fields: ${missingFields.join(
                    ", "
                  )}`,
                  color: "red",
                });
                return;
              }
            }

            const initialData = result.data.map((row, index) => {
              return {
                id: index + 1,
                ...row,
                status: "pending",
              };
            });

            setTableData(initialData);
            localStorage.setItem("tableData", JSON.stringify(initialData));
          },
        });
      };
      reader.readAsText(file);
    }
  };

  const { isPending, mutateAsync } = useMutation({
    mutationFn: async function () {
      if (!selectedFile) {
        notifications.show({ message: "No file selected", color: "red" });
        return;
      }

      console.log(selectedFile, "selected file");

      const formData = new FormData();
      formData.append("file", selectedFile);

      return await axiosClient.post(`/activate-bulk?mode=${mode?.label}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: (data) => {
      console.log(data, "📌 Processed Response");

      const { processedRecords, failedRecords } = data.data;

      setTableData((prevTableData) => {
        return prevTableData.map((row) => {
          const successRow = processedRecords.find(
            (item) => item.accountNumber === row.accountNumber
          );

          if (successRow) {
            return { ...row, status: "success" };
          }

          const failedRow = failedRecords.find(
            (item) => item.accountNumber === row.accountNumber
          );

          if (failedRow) {
            return { ...row, status: "failed", error: failedRow.message };
          }

          return row; // Return unchanged row if not found
        });
      });

      localStorage.setItem("tableData", JSON.stringify(tableData));

      notifications.show({
        message: `CSV processed: ${processedRecords.length} success, ${failedRecords.length} failed.`,
        color: processedRecords.length > 0 ? "green" : "red",
      });
    },
    onError: () => {
      notifications.show({ message: "Failed to upload CSV", color: "red" });
    },
  });

  const handleSubmitBulk = async () => {
    await mutateAsync();
  };

  const handleManualSubmit = (data) => {
    setTableData((prevData) => [...prevData, ...data]);
  };

  const clearFile = () => {
    setFileName(null);
    setTableData([]);
    localStorage.removeItem("fileName");
    localStorage.removeItem("tableData");
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
                    size={"sm"}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                  <Button
                    size="compact-xs"
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
