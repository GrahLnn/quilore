import { station } from "../subpub/buses";
import { Page } from "../subpub/type";
import Welcome from "./welcome";
import { PlatPage } from "./plat/pages";

export function ContentPage() {
  const page = station.page.useSee();

  return page.match({
    [Page.Welcome]: () => <Welcome />,
    [Page.Main]: () => <PlatPage />,

    [Page.NotFound]: () => <div />,
  });
}
