import { useParams } from "react-router";

export default function ServiceDetail() {
  const { slug } = useParams();
  return <h1>Service: {slug}</h1>;
}
