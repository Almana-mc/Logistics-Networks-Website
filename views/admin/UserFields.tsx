import Field from "../../components/Field";

type Values = { username: string; email: string };
type Props = { values: Values; onValues: (values: Values) => void };

export default function UserFields({ values, onValues }: Props) {
  return (
    <>
      <Field
        id="admin-username"
        label="Username"
        autoComplete="off"
        value={values.username}
        onValue={(username) => onValues({ ...values, username })}
      />
      <Field
        id="admin-email"
        label="Email"
        type="email"
        autoComplete="off"
        value={values.email}
        onValue={(email) => onValues({ ...values, email })}
      />
    </>
  );
}
