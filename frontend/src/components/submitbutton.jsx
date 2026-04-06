<button
  onClick={() => confirm(a.id)}
  disabled={progress === 100}
  className={`px-3 py-2 mt-2 rounded text-white 
    ${progress === 100 ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"}
  `}
>
  {progress === 100 ? "Completed" : "Confirm Submission"}
</button>