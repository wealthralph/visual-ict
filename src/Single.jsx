import { Button, NumberInput, Space, Stack } from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { axiosClient } from "./axiosClient";
import { notifications } from "@mantine/notifications";
import { MonthPickerInput } from "@mantine/dates";
import dayjs from "dayjs";

const Single = () => {
           const mode = JSON.parse(localStorage.getItem("mode"));



  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
    watch,
  } = useForm({
    mode: "onSubmit",
  });

  const watchExpiry = watch("expiry");

  console.log(dayjs(watchExpiry).format("MM/YY"), "watch expiry");

  const { isPending, mutateAsync } = useMutation({
    mutationFn: async function (data) {
      return await axiosClient.post(`activate?mode=${mode.label}`, data);
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

  const onSubmit = async (data) => {
    
     if (mode.label === "Interswitch") {
       data.expiry = dayjs(data.expiry).format("MM/YY");
     }
    await mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>

      {mode.label === "Providus" && ProvidusMode(register, errors)}
      {mode.label === "Interswitch" && InterswitchMode(register, errors, control)}
      <Space h="lg" />
      <Button type="submit" size="xs" loading={isPending} >
        Activate Card
      </Button>
    </form>
  );
};

export default Single;


const ProvidusMode = (register, errors) => {


  return (
    <Stack>
      <NumberInput
        placeholder="1023435840"
        label={"Account Number"}
        required
        inputMode="numeric"
        hideControls
        error={errors.accountNumber ? "Account number must be 10 digits" : null}
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
   
    </Stack>
  );


}

const InterswitchMode = (register , errors, control) => {


  return (
    <Stack>
      <NumberInput
        placeholder="cardPan"
        label={"Card Pan"}
        error={errors.pin ? "CVV must be 3 digits" : null}
        required
        inputMode="numeric"
        name="cardPan"
        hideControls
        {...register("cardPan", {
          required: "Card Pan is required",
     
        })}
      />

      <NumberInput
        placeholder="Pin"
        label={"Card Pin"}
        error={errors.pin ? "PIN must be 4 digits" : null}
        required
        inputMode="numeric"
        name="newPin"
        hideControls
        {...register("newPin", {
          required: "PIN is required",
          validate: (value) =>
            value.toString().length === 4 || "PIN must be 4 digits",
        })}
      />
      <NumberInput
        placeholder="cvv"
        label={"Card CVV"}
        error={errors.pin ? "CVV must be 3 digits" : null}
        required
        inputMode="numeric"
        name="cvv"
        hideControls
        {...register("cvv", {
          required: "CVV is required",
          validate: (value) =>
            value.toString().length === 4 || "CVV must be 4 digits",
        })}
      />
      <Controller
        name="expiry"
        control={control}
        rules={{ required: "Expiry date is required" }}
        render={({ field }) => (
          <MonthPickerInput
            label="Expiry"
            placeholder="Pick expiry date"
            required
            valueFormat="MM/YY"
            error={errors.expiry ? "Expiry date is required" : null}
            {...field}
          />
        )}
      />
    </Stack>
  );


}