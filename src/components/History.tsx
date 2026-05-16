import { useState, useEffect } from 'react';
import { Search, MessageSquare, FileText, Clock, Trash2, History as HistoryIcon } from 'lucide-react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import * as api from '../services/api';

interface HistoryItem {
  id: string;
  type: 'chat' | 'report';
  title: string;
  date: Date;
  preview: string;
}

export function History() {
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory();
      
      const items: HistoryItem[] = [];
      
      // Add reports
      if (data.reports?.items) {
        data.reports.items.forEach((report: any) => {
          items.push({
            id: report.id,
            type: 'report',
            title: `Report: ${report.filename || 'Untitled'}`,
            date: new Date(report.date || Date.now()),
            preview: typeof report.summary === 'string' ? report.summary.slice(0, 100) : (report.summary?.executive_summary?.slice(0, 100) || 'Generated report summary...')
          });
        });
      }
      
      // Add documents
      if (data.documents?.items) {
        data.documents.items.forEach((doc: any) => {
          items.push({
            id: doc.filename,
            type: 'chat',
            title: `Document: ${doc.filename}`,
            date: new Date(doc.upload_date ? doc.upload_date * 1000 : Date.now()),
            preview: `Uploaded document`
          });
        });
      }
      
      // Sort by date descending
      items.sort((a, b) => b.date.getTime() - a.date.getTime());
      setHistory(items);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const reportCount = filteredHistory.filter((i) => i.type === 'report').length;
  const docCount = filteredHistory.filter((i) => i.type === 'chat').length;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Search & Actions */}
      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHistory}
            disabled={loading}
            className="flex-shrink-0"
          >
            Refresh
          </Button>
        </div>
      </Card>

      {/* Stats Bar */}
      {!loading && history.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <Badge variant="secondary">{filteredHistory.length} items</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> {docCount} docs
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" /> {reportCount} reports
            </span>
          </div>
        </div>
      )}

      {/* History List */}
      <div className="space-y-3">
        {filteredHistory.map((item) => (
          <Card
            key={item.id}
            className="p-3 sm:p-4 md:p-5 hover:shadow-md transition-all cursor-pointer group"
            onClick={() => setSelectedItem(item)}
          >
            <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
              {/* Icon */}
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  item.type === 'chat'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-accent/20 text-accent'
                }`}
              >
                {item.type === 'chat' ? (
                  <MessageSquare className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
                ) : (
                  <FileText className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 sm:gap-3 md:gap-4 mb-1.5 sm:mb-2">
                  <h4 className="font-semibold group-hover:text-primary transition-colors text-sm sm:text-base truncate break-all">
                    {item.title}
                  </h4>
                  <Badge variant={item.type === 'chat' ? 'default' : 'secondary'} className="flex-shrink-0 text-[10px] sm:text-xs">
                    {item.type === 'chat' ? 'Document' : 'Report'}
                  </Badge>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2 break-words">
                  {item.preview}
                </p>

                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-wrap">
                  <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                    <span className="truncate">
                      {item.date.toLocaleDateString()} at {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline-flex"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem(item);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {/* Empty States */}
        {filteredHistory.length === 0 && !loading && searchQuery && (
          <Card className="p-8 sm:p-12">
            <div className="text-center text-muted-foreground">
              <Search className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No results for &ldquo;{searchQuery}&rdquo;</p>
              <p className="text-sm mt-1">Try a different search term</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </Button>
            </div>
          </Card>
        )}

        {filteredHistory.length === 0 && !loading && !searchQuery && (
          <Card className="p-8 sm:p-12">
            <div className="text-center text-muted-foreground">
              <HistoryIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No activity yet</p>
              <p className="text-sm mt-1">Upload documents or generate reports to see your history here</p>
            </div>
          </Card>
        )}
        
        {loading && (
          <Card className="p-8 sm:p-12">
            <div className="text-center text-muted-foreground">
              <div
                className="w-8 h-8 mx-auto mb-3 rounded-full border-2 border-primary border-t-transparent"
                style={{ animation: 'spin 1s linear infinite' }}
              />
              <p className="text-sm">Loading history...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
            <DialogDescription>
              {selectedItem ? `${selectedItem.date.toLocaleDateString()} at ${selectedItem.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Badge variant={selectedItem?.type === 'chat' ? 'default' : 'secondary'}>
              {selectedItem?.type === 'chat' ? 'Document Activity' : 'Report Activity'}
            </Badge>
            <p className="text-sm text-muted-foreground">{selectedItem?.preview}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
