import { usePageName, Page } from "../subpub/pageBus";
import Posts from "./posts";
import Welcome from "./welcome";

export function randerPage() {
  const page = usePageName();

  return page.match({
    [Page.Welcome]: () => <Welcome />,
    [Page.Main]: () => <Posts />,
    
    [Page.NotFound]: () => <div />,
  });
}
