import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClaimPage = ({ currentUser }) => {
  const [claims, setClaims] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // ⭐ Tamam users ko store karne ke liye
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [actionData, setActionData] = useState({ id: null, remarks: '' });

  useEffect(() => {
    fetchInitialData();
  }, [filters]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // 1. Pehle hum sab users ki list mangwa rahe hain
      const usersRes = await axios.get('http://194.163.190.100:8080/api/users');
      setAllUsers(usersRes.data || []);

      // 2. Phir claims mangwa rahe hain
      const claimsRes = await axios.get('http://194.163.190.100:8080/api/claims/pending', {
        params: {
          userId: currentUser.id,
          type: currentUser.type,
          shortName: currentUser.shortName,
          ...filters
        }
      });
      setClaims(claimsRes.data.data || []);
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ Ye function ID lekar User ka Name dhoondta hai
  const getApproverName = (approverId) => {
    if (!approverId) return null;
    const foundUser = allUsers.find(u => u._id === approverId || u.id === approverId);
    return foundUser ? foundUser.name : "Unknown User";
  };

  const handleApproval = async (id, status) => {
    if (!actionData.remarks && status === 'Rejected') {
      alert("Please add remarks for rejection");
      return;
    }
    try {
      await axios.post(`http://194.163.190.100:8080/api/items/${id}/approve-claim`, {
        remarksTM: actionData.remarks,
        status: status,
        approverId: currentUser.id, // ID bhej rahe hain
        userShortName: currentUser.shortName
      });
      alert(`Claim ${status} Successfully`);
      setActionData({ id: null, remarks: '' });
      fetchInitialData();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || "Server Error"));
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Claim Approvals</h2>
        <div className="flex gap-4 bg-white p-3 rounded-lg shadow-sm border text-sm">
          <input type="date" className="border p-2 rounded" onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
          <input type="date" className="border p-2 rounded" onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
          <button onClick={fetchInitialData} className="bg-blue-600 text-white px-4 py-2 rounded">Filter</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-700 uppercase text-[11px] font-bold">
            <tr>
              <th className="p-4">Tracking ID</th>
              <th className="p-4">Store</th>
              <th className="p-4">Product</th>
              <th className="p-4">Apporvd By</th> {/* ⭐ Yahan Name aayega */}
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="6" className="text-center p-10">Loading...</td></tr>
            ) : (
              claims.map((item) => {
                // Pehle check karo database mein kaunsi ID pari hai
                const approverId = item.approvedBy || item.approverId;
                const displayName = item.claimApproved !== 'Pending'
                  ? getApproverName(approverId)
                  : (item.store?.tmName || "Pending");

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="p-4 font-bold text-blue-600">{item.trackingId}</td>
                    <td className="p-4 text-sm">{item.store?.name}</td>
                    <td className="p-4 text-xs">{item.articleNo} | {item.size}</td>

                    {/* ⭐ Name Display Column */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
                          {displayName.substring(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-700">{displayName}</div>
                          <div className="text-[10px] text-gray-400 uppercase">
                            {item.claimApproved !== 'Pending' ? '' : 'Assigned TM'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.claimApproved === 'Approved' ? 'bg-green-100 text-green-700' :
                        item.claimApproved === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {item.claimApproved}
                      </span>
                    </td>

                    <td className="p-4">
                      {currentUser.shortName.toLowerCase() === 'tm' && item.claimApproved === 'Pending' ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            className="border p-1 text-xs w-full"
                            placeholder="Remarks..."
                            value={actionData.id === item.id ? actionData.remarks : ''}
                            onChange={(e) => setActionData({ id: item.id, remarks: e.target.value })}
                          />
                          <div className="flex gap-1">
                            <button onClick={() => handleApproval(item.id, 'Approved')} className="bg-green-600 text-white text-[10px] py-1 px-2 rounded flex-1">Approve</button>
                            <button onClick={() => handleApproval(item.id, 'Rejected')} className="bg-red-600 text-white text-[10px] py-1 px-2 rounded flex-1">Reject</button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs italic text-gray-500">{item.remarksTM || 'No remarks'}</div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClaimPage;