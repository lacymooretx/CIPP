import { Box, CardContent } from "@mui/material";
import { Grid } from "@mui/system";
import CippFormSection from "../CippFormPages/CippFormSection";
import CippFormComponent from "../CippComponents/CippFormComponent";
import { useForm } from "react-hook-form";
import { useSettings } from "../../hooks/use-settings";
import { ApiGetCall } from "../../api/ApiCall";
import { useRouter } from "next/router";
import extensions from "../../data/Extensions.json";
import React, { useEffect } from "react";
import { CippFormCondition } from "../CippComponents/CippFormCondition";

const CippIntegrationSettings = ({ children }) => {
  const router = useRouter();
  const settings = useSettings();
  const preferredTheme = settings.currentTheme?.value;

  const integrations = ApiGetCall({
    url: "/api/ListExtensionsConfig",
    queryKey: "Integrations",
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const formControl = useForm({
    mode: "onChange",
  });

  const extension = extensions.find((extension) => extension.id === router.query.id);
  const enabled = formControl.watch(`${extension?.id}.Enabled`);

  var logo = extension?.logo;
  if (preferredTheme === "dark" && extension?.logoDark) {
    logo = extension.logoDark;
  }

  // Reset the form whenever the API data reference changes (including the initial
  // undefined -> real-data transition). The previous pattern depended on
  // `integrations.isSuccess` flipping, which already happened before this child
  // mounted in many cases, so the effect fired once with `integrations.data`
  // still undefined and the form stayed on its per-Controller defaults.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__cippIntegEffect = (window.__cippIntegEffect || []);
      window.__cippIntegEffect.push({
        ts: Date.now(),
        dataIsTruthy: !!integrations.data,
        dataKeys: integrations.data ? Object.keys(integrations.data) : null,
      });
    }
    if (integrations.data) {
      formControl.reset(integrations.data);
    }
  }, [integrations.data]);

  return (
    <>
      {integrations.isSuccess && extension ? (
        <CippFormSection
          relatedQueryKeys={"Integrations"}
          formControl={formControl}
          formPageType="Integration"
          title={extension.name}
          backButtonTitle="Integrations"
          postUrl="/api/ExecExtensionsConfig"
          resetForm={false}
        >
          {children}
          <Grid container sx={{ alignItems: "center" }}>
            {extension.SettingOptions.map((setting, index) => (
              <React.Fragment key={index}>
                {setting?.condition ? (
                  <CippFormCondition {...setting.condition} formControl={formControl} disabled={extension.SettingOptions.find(s => s.name === `${extension.id}.Enabled`) && !enabled}>
                    <Grid size={{ xs: 12, md: setting.type === "switch" ? 12 : 6 }}>
                      <Box sx={{ p: 1 }}>
                        <CippFormComponent
                          name={setting.name}
                          type={setting.type}
                          label={setting.label}
                          options={setting.options}
                          formControl={formControl}
                          placeholder={setting?.placeholder}
                          fullWidth
                          {...setting}
                        />
                      </Box>
                    </Grid>
                  </CippFormCondition>
                ) : (
                  <Grid size={{ xs: 12, md: setting.type === "switch" ? 12 : 6 }}>
                    <Box sx={{ p: 1 }}>
                      <CippFormComponent
                        name={setting.name}
                        type={setting.type}
                        label={setting.label}
                        options={setting.options}
                        formControl={formControl}
                        placeholder={setting?.placeholder}
                        fullWidth
                        {...setting}
                      />
                    </Box>
                  </Grid>
                )}
              </React.Fragment>
            ))}
          </Grid>
        </CippFormSection>
      ) : (
        <CardContent>
          {integrations.isLoading && <Box>Loading...</Box>}
          {integrations.isSuccess && !extension && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ p: 3 }}>
                  <Box sx={{ textAlign: "center" }}>Extension not found</Box>
                </Box>
              </Grid>
            </Grid>
          )}
        </CardContent>
      )}
    </>
  );
};

export default CippIntegrationSettings;
