import {useState} from "react";

export default function SubmitButton({assignmentId, groupId, isSubmitted, onConfirm }){
  const [loading,   setLoading]   = useState(false);

  const [error,     setError]     = useState('');

  const [confirmed, setConfirmed] = useState(isSubmitted ?? false);

 

  const handleConfirm = async () => {

    if (confirmed || loading) return; // guard: no double-submit

    setLoading(true);

    setError('');

    try {

      await onConfirm(assignmentId, groupId); // parent handles API + progress refresh

      setConfirmed(true);

    } catch (err) {

      setError(err.response?.data?.msg || 'Submission failed — try again');

    } finally {

      setLoading(false);

    }

  };

  if (confirmed) {
    return (

      <span className="inline-flex items-center gap-1 px-3 py-2 mt-2 rounded

                       bg-gray-100 text-gray-500 text-sm font-medium">

        ✓ Submitted

      </span>

    );

  }

  return (
    <div className="mt-2">

      <button

        onClick={handleConfirm}

        disabled={loading}

        className="px-3 py-2 rounded text-white text-sm font-medium

                   bg-green-500 hover:bg-green-600

                   disabled:opacity-50 disabled:cursor-not-allowed

                   transition-colors duration-150"

      >

        {loading ? 'Confirming...' : 'Confirm Submission'}

      </button>

      {error && (

        <p className="text-red-500 text-xs mt-1">{error}</p>

      )}

    </div>

  );

}
