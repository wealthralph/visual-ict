import { Button, NumberInput, Stack } from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { axiosClient } from "./axiosClient";
import { notifications } from "@mantine/notifications";

const Single = () => {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
  });

  const { isPending, mutateAsync } = useMutation({
    mutationFn: async function (data) {
      return await axiosClient.post("/activate", data);
    },
    onSuccess: () => {
      notifications.show({
        color: "green",
        message: `Card Activated Successfully`,
      });
    },
    onError: () => {
           notifications.show({
             message: `Failed to activate card`,
             color: "red",
           });
    }
  });

  const onSubmit = async (data) => mutateAsync(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack>
        <NumberInput
          placeholder="1023435840"
          label={"Account Number"}
          required
          inputMode="numeric"
          hideControls
          error={
            errors.accountNumber ? "Account number must be 10 digits" : null
          }
          {...register("accountNumber", {
            required: "Account number is required",
            validate: (value) =>
              value.toString().length === 10 ||
              "Account number must be 10 digits",
          })}
        />
        <NumberInput
          placeholder="Pin"
          label={"Card Pin"}
          error={errors.pin ? "PIN must be 4 digits" : null}
          required
          inputMode="numeric"
          hideControls
          {...register("pin", {
            required: "PIN is required",
            validate: (value) =>
              value.toString().length === 4 || "PIN must be 4 digits",
          })}
        />
        <Button type="submit" size="xs" loading={isPending}>
          Activate Card
        </Button>
      </Stack>
    </form>
  );
};

export default Single;
