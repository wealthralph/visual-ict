import { useState } from "react";
import { useForm } from "react-hook-form";
import { axiosClient } from "./axiosClient";
import {  Button, Input, PinInput, Stack, TextInput } from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";

function Admin() {
  const [isAuthorized, setIsAuthorized] = useState(false);

  const { register, handleSubmit } = useForm();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async function (token) {
      return await axiosClient.post("/verifyPin", { token });
    },
    onSuccess: () => {
        setIsAuthorized(true)
      notifications.show({
        color: "green",
        title: `Authorization Succesful`,
        message: "You can now change the access token",
      });
    },
    onError: () => {
      notifications.show({
        title: `Authorization Failed`,
        message: "Contact your admin for authorization",
        color: "red",
      });
    },
  });

  const { mutateAsync:tokenMutateAsync, isPending: tokenPending } = useMutation({
    mutationFn: async function (token) {
      return await axiosClient.post("/token", { token });
    },
    onSuccess: () => {
        setIsAuthorized(true)
      notifications.show({
        color: "green",
        title: `Token Set Succesfully`,
        message: "Access Token has been change ",
      });
    },
    onError: () => {
      notifications.show({
        title: `Token set failed`,
        message: "Failed to set access token ",
        color: "red",
      });
    },
  });



  if (!isAuthorized) {
    return (
      <Stack>
        <Input.Label required>
        Enter Security Pin
        </Input.Label>
        <PinInput
          length={4}
          inputMode="numeric"
          onComplete={(token) => mutateAsync(token)}
        />
        <Button type="button" size="xs" loading={isPending}>
          Verify Pin
        </Button>
      </Stack>
    );
  }

  return <form onSubmit={handleSubmit((data) =>  tokenMutateAsync(data))}>
    <Stack>
        <TextInput
            placeholder="token"
            label={"Access Token"}
            {...register("token")}
        />
        <Button type="submit" loading={tokenPending}>
            Change Token
        </Button>
    </Stack>
  </form>;
}

export default Admin;
