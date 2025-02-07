import { useState } from "react";
import { useForm } from "react-hook-form";
import { axiosClient } from "./axiosClient";
import { Box, Button, Flex,  PinInput, Stack, Text, TextInput } from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";

function Admin() {
  const [isAuthorized, setIsAuthorized] = useState(false);

  const { register, handleSubmit } = useForm();

  const { mutateAsync } = useMutation({
    mutationFn: async function (token) {
      return await axiosClient.post("/verifyPin", { token });
    },
    onSuccess: () => {
      setIsAuthorized(true);
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

  const { mutateAsync: tokenMutateAsync, isPending: tokenPending } =
    useMutation({
      mutationFn: async function (token) {
        return await axiosClient.post("/token", token);
      },
      onSuccess: () => {
        setIsAuthorized(true);
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
      <Stack align="start">
        <Box>
          <Text size="sm">Verify Admin Access</Text>
          <Text c={"dimmed"} size="xs">
            Enter the 4 digit admin pin to get access to admin settings.
          </Text>
        </Box>{" "}
        <PinInput
          length={4}
          inputMode="numeric"
          onComplete={(token) => mutateAsync(token)}
        />
        {/* <Box>
          <Button type="button" size="compact-xs" variant="filled" loading={isPending}>
            Verify Pin
          </Button>
        </Box> */}
      </Stack>
    );
  }

  return (
    <form onSubmit={handleSubmit((data) => tokenMutateAsync(data))}>
      <Stack>
        <Box>
          <Text size="sm">Access Token</Text>
          <Text c={"dimmed"} size="xs">
            Change access production api access token.
          </Text>
        </Box>{" "}
        <TextInput
          placeholder="token"
          // label={"Access Token"}
          {...register("token")}
          size="sm"
          radius={'md'}
        />
        <Flex justify={"end"}>
          <Button type="submit" loading={tokenPending} size="compact-sm">
            Change Token
          </Button>
        </Flex>
      </Stack>
    </form>
  );
}

export default Admin;
