import { useEffect, useState } from "react";
import { useAptos } from "../providers/MantleWalletProvider.jsx";
import { usePointsStore } from "../store/points-store.js";
import { getPointsConfig } from "../lib/supabase.js";
import { Button, Card, CardBody, Spinner, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip } from "@nextui-org/react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getPointsLeaderboard } from "../lib/supabase.js";

export default function PointsPage() {
  const { account } = useAptos();
  const { points, pointsHistory, loadPointsHistory, isLoading } = usePointsStore();
  const [pointsConfig, setPointsConfig] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (account) {
      loadPointsHistory(account);
      loadPointsConfig();
      loadLeaderboard();
    }
  }, [account, loadPointsHistory]);

  const loadPointsConfig = async () => {
    try {
      const config = await getPointsConfig();
      setPointsConfig(config);
    } catch (error) {
      console.error('Error loading points config:', error);
    }
  };

  const loadLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const leaderboardData = await getPointsLeaderboard(100);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pt-24 pb-24">
      <div className="flex items-center justify-between mb-6 sticky top-20 z-40 bg-white/95 backdrop-blur-sm py-4 -mx-4 px-4 rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900">Points & Rewards</h1>
        <Button
          onClick={() => navigate("/")}
          className="bg-primary text-white relative z-50 pointer-events-auto"
        >
          Back to Dashboard
        </Button>
      </div>

      {/* Points Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardBody className="p-6">
            <p className="text-sm text-gray-600 mb-2">Total Points</p>
            <p className="text-3xl font-bold text-primary">{points.totalPoints.toLocaleString()}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-6">
            <p className="text-sm text-gray-600 mb-2">Lifetime Points</p>
            <p className="text-3xl font-bold text-amber-600">{points.lifetimePoints.toLocaleString()}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-6">
            <p className="text-sm text-gray-600 mb-2">Current Level</p>
            <p className="text-3xl font-bold text-green-600">Level {points.level}</p>
          </CardBody>
        </Card>
      </div>

      {/* Points History */}
      <Card className="mb-6">
        <CardBody className="p-6">
          <h2 className="text-xl font-semibold mb-4">Points History</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : pointsHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No points history yet. Start earning points by using PRIVATEPAY!</p>
          ) : (
            <Table aria-label="Points history">
              <TableHeader>
                <TableColumn>Date</TableColumn>
                <TableColumn>Action</TableColumn>
                <TableColumn>Points</TableColumn>
                <TableColumn>Description</TableColumn>
              </TableHeader>
              <TableBody>
                {pointsHistory.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.created_at)}</TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat" color="primary">
                        {transaction.transaction_type.replace(/_/g, ' ')}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">+{transaction.points}</span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {transaction.description || 'Points earned'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Points Guide */}
      <Card>
        <CardBody className="p-6">
          <h2 className="text-xl font-semibold mb-4">How to Earn Points</h2>
          {pointsConfig.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Loading points configuration...</p>
          ) : (
            <div className="space-y-3">
              {pointsConfig.map((config) => (
                <div key={config.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">{config.description || config.action_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-600 capitalize">{config.action_type.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-primary">+{config.points_value}</p>
                    <p className="text-xs text-gray-600">points</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Leaderboard Section */}
      <Card className="mt-6">
        <CardBody className="p-6">
          <h2 className="text-xl font-semibold mb-4">Top Users</h2>
          <p className="text-sm text-gray-600 mb-4">Ranked by lifetime points</p>
          {isLoadingLeaderboard ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : leaderboard.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No leaderboard data yet.</p>
          ) : (
            <Table aria-label="Leaderboard">
              <TableHeader>
                <TableColumn>Rank</TableColumn>
                <TableColumn>Wallet</TableColumn>
                <TableColumn>Level</TableColumn>
                <TableColumn>Lifetime Points</TableColumn>
              </TableHeader>
              <TableBody>
                {leaderboard.map((user, index) => (
                  <TableRow key={user.wallet_address}>
                    <TableCell>
                      <span className="font-bold text-lg">#{index + 1}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat" color="success">
                        Level {user.level}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-amber-600">
                        {user.lifetime_points.toLocaleString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
