import system, { pad, gap, radius, shadow, browserStyles } from "@-ui/system";
import styles from "@-ui/react";

const color = {
  dark: "#1d2326",
  med: "#373b3e",
  light: "#f2fafe"
};

export const variables = {
  color
};

styles.variables(variables);

system.use({
  pad: pad(),
  gap: gap(),
  radius: radius(),
  shadow: shadow()
});

styles.global(
  ({ color }) => `
    html,
    body {
      font-size: 1rem;
      font-family: Nunito, sans-serif;
      letter-spacing: -0.025em;
      color: ${color.body};
      background-color: ${color.light};
    }

    ${browserStyles}
  `
);

export { default as styles } from "@-ui/react";
