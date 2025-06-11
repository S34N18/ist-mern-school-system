import React, { useState } from "react";
import axios from "axios";

const AddClassRoomForm = ({ onClassroomAdded }) => {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token"); // Make sure this is how you're storing your JWT

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/classrooms`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      onClassroomAdded(); // Refresh parent list
      setFormData({ name: "", code: "", description: "" });
    } catch (err) {
      console.error(err);
      setError("Failed to create classroom. Please try again.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto my-4 flex flex-col gap-2 p-4 bg-white shadow-md rounded"
    >
      <input
        type="text"
        name="name"
        placeholder="Classroom Name"
        value={formData.name}
        onChange={handleChange}
        className="p-2 rounded border border-gray-300"
        required
      />
      <input
        type="text"
        name="code"
        placeholder="Classroom Code"
        value={formData.code}
        onChange={handleChange}
        className="p-2 rounded border border-gray-300"
        required
      />
      <textarea
        name="description"
        placeholder="Description"
        value={formData.description}
        onChange={handleChange}
        className="p-2 rounded border border-gray-300"
        rows={3}
        required
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        className="p-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded"
      >
        Add Classroom
      </button>
    </form>
  );
};

export default AddClassRoomForm;
