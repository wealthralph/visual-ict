import { ActionIcon, Button, Flex, Group, Modal, NumberInput, Stack, TextInput } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

function BulkModal({ opened, close, setTableData }) {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      activate: [{ accountNumber: "", pin: 0 }],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "activate",
    // rules: {
    //   minLength: 4,
    // },
  });

  const handleFormSubmit = (data) => {
    console.log(data, "data from form submit");
    if (data.activate) {
      setTableData((prevData) => [...prevData, ...data.activate]);
    }
    close();
  };


  return (
    <Modal
      opened={opened}
      onClose={close}
      size={"md"}
      title={"Activate Card"}
      p={"xs"}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Stack align="center" w={"100%"}>
          <Stack w={"100%"}>
            {fields.map((item, index) => (
              <Flex key={item.id} gap={"xs"} w={"100%"}>
                <Controller
                  rules={{ required: true }}
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
                  rules={{ required: true }}
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
          <Group>
            <Button
              size="xs"
              onClick={() => append({ accountNumber: "", pin: " " })}
              variant="default"
              leftSection={<IconPlus size={16} />}
              type="button"
            >
              Add fields
            </Button>
            <Button onClick={handleFormSubmit} size="xs" type="submit">
              Submit
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}


export default BulkModal