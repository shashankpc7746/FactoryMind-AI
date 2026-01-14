import { useState } from 'react';
import { Search, MessageSquare, FileText, Clock } from 'lucide-react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface HistoryItem {
  id: string;
  type: 'chat' | 'report';
  title: string;
  date: Date;
  preview: string;
}

export function History() {
  const [searchQuery, setSearchQuery] = useState('');
  const [history] = useState<HistoryItem[]>([]);

  const filteredHistory = history.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* History List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <Badge variant="secondary">{filteredHistory.length} items</Badge>
        </div>

        {filteredHistory.map((item) => (
          <Card
            key={item.id}
            className="p-5 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  item.type === 'chat'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-accent/20 text-accent'
                }`}
              >
                {item.type === 'chat' ? (
                  <MessageSquare className="w-5 h-5" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h4 className="font-semibold group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <Badge variant={item.type === 'chat' ? 'default' : 'secondary'}>
                    {item.type === 'chat' ? 'Chat' : 'Report'}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {item.preview}
                </p>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {item.date.toLocaleDateString()} at {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filteredHistory.length === 0 && (
          <Card className="p-12">
            <div className="text-center text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No items found</p>
              <p className="text-sm mt-1">Try adjusting your search query</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
