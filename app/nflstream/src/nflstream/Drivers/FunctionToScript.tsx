export default function FunctionToScript<T>(props: {
  t: T;
  f: (t: T) => void;
}) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `\n(${props.f.toString()})(${JSON.stringify(props.t)})\n`,
      }}
    ></script>
  );
}

function x() {
  const OrigXHR = window.XMLHttpRequest;
  Object.getOwnPropertyNames(OrigXHR);
}
console.log(x.toString());
