import { usePageName, Page } from "../subpub/pageBus";
import Welcome from "./welcome";
import { PlatPage } from "./plat/pages";

export function ContentPage() {
  const page = usePageName();

  return page.match({
    [Page.Welcome]: () => <Welcome />,
    [Page.Main]: () => <PlatPage />,

    [Page.NotFound]: () => <div />,
  });
}
