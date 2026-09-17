import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Users } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

// Sign-up form. Creates an account with the chosen role (faculty or student)
// via the auth context, stores the token, and enters the app.
const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("FACULTY");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(name, email, password, role);
      navigate("/");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  };

  const roleTab = (value, label, Icon) => (
    <button
      type="button"
      onClick={() => setRole(value)}
      className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        role === value
          ? "bg-blue-600 text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <Icon className="size-4" /> {label}
    </button>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-gray-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-2xl font-bold text-gray-900">Create your TeamOps account</h1>

        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {roleTab("FACULTY", "Faculty", GraduationCap)}
          {roleTab("STUDENT", "Student", Users)}
        </div>

        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-blue-600 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Sign up"}
        </button>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
