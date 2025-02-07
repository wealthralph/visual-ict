import Papa from "papaparse";
import { useDisclosure } from "@mantine/hooks";
import { useRef, useState } from "react";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Combobox,
  Flex,
  Group,
  Input,
  Pagination,
  Select,
  Stack,
  Table,
  Text,
  useCombobox,
} from "@mantine/core";
import {
  IconEdit,
  IconFileTypeCsv,
  IconInfoCircle,
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
  const [activePage, setPage] = useState(1);
  const [isChunked, setIsChunked] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const prevModeRef = useRef();

  const paginatedData = isChunked
    ? tableData[activePage - 1]
    : tableData.slice(
        (activePage - 1) * itemsPerPage,
        activePage * itemsPerPage
      );

  const totalItems = isChunked ? tableData.flat().length : tableData.length;
  const startItem = itemsPerPage * (activePage - 1) + 1;
  const endItem = Math.min(totalItems, itemsPerPage * activePage);

  const message = `Showing ${startItem} – ${endItem} of ${totalItems}`;

  const handlePageChange = (page) => {
    setPage(page);
  };

  const mode = localStorage.getItem("mode");
  const config = JSON.parse(localStorage.getItem("config"));

  useEffect(() => {
    const savedFileName = localStorage.getItem("fileName");
    const savedTableData = localStorage.getItem("tableData");

    if (savedFileName && savedTableData) {
      setFileName(savedFileName);
      // setTableData(JSON.parse(savedTableData));
    }
  }, []);

  useEffect(() => {
    if (prevModeRef.current && prevModeRef.current !== mode) {
      localStorage.removeItem("fileName");
      localStorage.removeItem("tableData");
    }
    prevModeRef.current = mode;
  }, [mode]);

  function chunk(array, size) {
    if (!array.length) {
      return [];
    }
    const head = array.slice(0, size);
    const tail = array.slice(size);
    return [head, ...chunk(tail, size)];
  }

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
            if (mode === "Interswitch") {
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

            if (result.data.length > config.csv_data_length) {
              const chunkedData = chunk(initialData, config.batch_size);
              setTableData(chunkedData);
              setIsChunked(true);
            } else {
              setTableData(initialData);
              setIsChunked(false);
            }

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

      return await axiosClient.post(
        `/activate-bulk?mode=${mode}&batchSize=${config.batch_size}&batching=${config.enable}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
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
            return { ...row, status: "failed" };
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

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const options = ["10", "20", "30", "40", "50", "60", "70"].map((item) => (
    <Combobox.Option value={item} key={item}>
      {item}
    </Combobox.Option>
  ));

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

          {config.enable_data_batching &&
            totalItems > config.csv_data_length && (
              <Alert
                variant="light"
                p={"xs"}
                color="green"
                title="Data batching is enbaled "
                icon={<IconInfoCircle />}
                radius={"md"}
                maw={500}
                c={"green"}
              >
                This means that your data will be processed in smaller chunks to
                improve performance and reliability. Go to settings to configure
                data batching settings.
              </Alert>
            )}

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

          <Stack>
            {Array.isArray(tableData) && tableData.length > 0 && (
              <Stack>
                <Table
                  highlightOnHover
                  mt="md"
                  striped
                  withTableBorder
                  withColumnBorders
                >
                  <Table.Thead>
                    <Table.Tr>
                      {Object.keys(
                        isChunked ? tableData[0][0] : tableData[0]
                      ).map((key) => (
                        <Table.Th tt={"capitalize"} key={key}>
                          {key}
                        </Table.Th>
                      ))}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedData.map((row, index) => (
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
                <Stack>
                  <Text size="sm">{message}</Text>

                  <Flex justify={"space-between"} gap={"xl"} align={"baseline"}>
                    <Combobox
                      store={combobox}
                      width={250}
                      position="bottom-start"
                      withArrow
                      onOptionSubmit={(val) => {
                        setItemsPerPage(Number(val));
                        combobox.closeDropdown();
                      }}
                    >
                      <Combobox.Target>
                        <Button
                          size="compact-sm"
                          variant="default"
                          onClick={() => combobox.toggleDropdown()}
                        >
                          {itemsPerPage}
                        </Button>
                      </Combobox.Target>

                      <Combobox.Dropdown>
                        <Combobox.Options>{options}</Combobox.Options>
                      </Combobox.Dropdown>
                    </Combobox>{" "}
                    <Pagination
                      total={
                        isChunked
                          ? tableData.length
                          : Math.ceil(tableData.length / itemsPerPage)
                      }
                      value={activePage}
                      onChange={handlePageChange}
                      mt="sm"
                      size={"sm"}
                      withEdges
                    />
                  </Flex>
                </Stack>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Box>
    </>
  );
}

export default Bulk;
